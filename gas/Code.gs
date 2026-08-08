/**
 * たまフィット スタッフカレンダー API
 *
 * このファイルは「新しいスタンドアロン Apps Script プロジェクト」に貼り付けて使います。
 * 公開予約用の既存GASには混ぜません。
 *
 * デプロイ設定:
 * - 種類: ウェブアプリ
 * - 実行ユーザー: 自分
 * - アクセスできるユーザー: 匿名アクセスを許可する選択肢（Anyone）がある場合はそれを選択
 *
 * このAPIはログインなしで予定を読み書きします。スタッフ用URLを第三者に共有しないでください。
 */

const STAFF_CALENDAR_ID = "tamafit.takamatsu@gmail.com";
const STAFF_TIMEZONE = "Asia/Tokyo";
const STAFF_META_MARKER = "\n[TAMAFIT_STAFF_CALENDAR]\n";
const STAFF_LIST_CACHE_SECONDS = 20;
const STAFF_CACHE_VERSION_KEY = "tamafit_staff_calendar_cache_version";
const STAFF_TRAINERS = {
  tamai: "玉井",
  obayashi: "大林"
};
const STAFF_TYPES = {
  member: "通常予約",
  trial: "体験",
  consultation: "見学・相談",
  blocked: "予定ブロック"
};

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = String(params.action || "");

    if (action === "staffCalendarList") {
      return staffResponse_({
        status: "success",
        events: staffListEvents_(params.startDate, params.endDate)
      });
    }

    if (action === "staffCalendarGet") {
      const event = staffGetEvent_(params.id);
      return staffResponse_({ status: "success", event: event });
    }

    return staffResponse_({ status: "error", message: "未対応の操作です。" });
  } catch (error) {
    return staffErrorResponse_(error);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = String(data.action || "");

    if (action === "staffCalendarCreate") {
      return staffResponse_(staffWithLock_(function() {
        const event = staffCreateEvent_(data.event || {});
        return { status: "success", event: event };
      }));
    }

    if (action === "staffCalendarUpdate") {
      return staffResponse_(staffWithLock_(function() {
        const event = staffUpdateEvent_(data.id, data.event || {});
        return { status: "success", event: event };
      }));
    }

    if (action === "staffCalendarDelete") {
      return staffResponse_(staffWithLock_(function() {
        staffDeleteEvent_(data.id);
        return { status: "success" };
      }));
    }

    return staffResponse_({ status: "error", message: "未対応の操作です。" });
  } catch (error) {
    return staffErrorResponse_(error);
  }
}

function staffListEvents_(startDate, endDate) {
  const start = staffDayStart_(startDate);
  const end = staffDayAfter_(endDate);
  if (end.getTime() <= start.getTime()) throw new Error("期間を確認してください。");

  const cache = CacheService.getScriptCache();
  const cacheKey = ["list", staffCacheVersion_(), startDate, endDate].join(":");
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      cache.remove(cacheKey);
    }
  }

  const events = staffCalendar_().getEvents(start, end)
    .map(staffSerializeEvent_)
    .sort(function(a, b) { return a.startAt.localeCompare(b.startAt); });
  try {
    cache.put(cacheKey, JSON.stringify(events), STAFF_LIST_CACHE_SECONDS);
  } catch (error) {
    // A very large event description should not make the calendar unavailable.
  }
  return events;
}

function staffGetEvent_(id) {
  if (!id) throw new Error("予約IDがありません。");
  const event = staffCalendar_().getEventById(String(id));
  if (!event) throw new Error("予約が見つかりませんでした。");
  return staffSerializeEvent_(event);
}

function staffCreateEvent_(input) {
  const reservation = staffNormalizeInput_(input);
  staffEnsureNoConflict_(reservation, "");

  const event = staffCalendar_().createEvent(
    staffTitle_(reservation),
    staffParseDateTime_(reservation.startAt),
    staffParseDateTime_(reservation.endAt)
  );
  staffWriteMetadata_(event, reservation);
  staffBumpCacheVersion_();
  return staffSerializeEvent_(event);
}

function staffUpdateEvent_(id, input) {
  if (!id) throw new Error("予約IDがありません。");
  const event = staffCalendar_().getEventById(String(id));
  if (!event) throw new Error("予約が見つかりませんでした。");

  const reservation = staffNormalizeInput_(input);
  staffEnsureNoConflict_(reservation, event.getId());
  event.setTitle(staffTitle_(reservation));
  event.setTime(staffParseDateTime_(reservation.startAt), staffParseDateTime_(reservation.endAt));
  staffWriteMetadata_(event, reservation);
  staffBumpCacheVersion_();
  return staffSerializeEvent_(event);
}

function staffDeleteEvent_(id) {
  if (!id) throw new Error("予約IDがありません。");
  const event = staffCalendar_().getEventById(String(id));
  if (!event) throw new Error("予約が見つかりませんでした。");
  event.deleteEvent();
  staffBumpCacheVersion_();
}

function staffNormalizeInput_(input) {
  const raw = input || {};
  const trainerId = String(raw.trainerId || "");
  const type = String(raw.type || "member");
  const startAt = String(raw.startAt || "");
  const endAt = String(raw.endAt || "");
  const customerName = String(raw.customerName || "").trim();
  const notes = String(raw.notes || "").trim();
  const duration = Number(raw.duration || 0);

  if (!STAFF_TRAINERS[trainerId]) throw new Error("担当トレーナーを選択してください。");
  if (!STAFF_TYPES[type]) throw new Error("予約種類を確認してください。");
  if (!customerName) throw new Error("お客様名または予定名を入力してください。");
  if (![30, 60, 90].includes(duration)) throw new Error("所要時間を確認してください。");

  const start = staffParseDateTime_(startAt);
  const end = staffParseDateTime_(endAt);
  if (end.getTime() <= start.getTime()) throw new Error("終了時刻を確認してください。");
  if (end.getTime() - start.getTime() !== duration * 60 * 1000) throw new Error("所要時間と終了時刻が一致しません。");

  return {
    customerName: customerName,
    trainerId: trainerId,
    startAt: staffFormatDateTime_(start),
    endAt: staffFormatDateTime_(end),
    duration: duration,
    type: type,
    notes: notes
  };
}

function staffEnsureNoConflict_(reservation, excludedEventId) {
  const start = staffParseDateTime_(reservation.startAt);
  const end = staffParseDateTime_(reservation.endAt);
  const dayStart = staffDayStart_(reservation.startAt.slice(0, 10));
  const dayEnd = staffDayAfter_(reservation.startAt.slice(0, 10));
  const events = staffCalendar_().getEvents(dayStart, dayEnd);

  const conflict = events.some(function(event) {
    if (event.getId() === excludedEventId) return false;
    const existing = staffSerializeEvent_(event);
    if (existing.trainerId !== reservation.trainerId) return false;
    return start.getTime() < event.getEndTime().getTime() && end.getTime() > event.getStartTime().getTime();
  });

  if (conflict) throw new Error("同じ担当トレーナーに重複する予約があります。");
}

function staffSerializeEvent_(event) {
  const metadata = staffReadMetadata_(event.getDescription());
  const title = event.getTitle();
  const type = metadata.type || staffInferType_(title);
  const customerName = metadata.customerName || staffNameFromTitle_(title);

  return {
    id: event.getId(),
    customerName: customerName,
    trainerId: metadata.trainerId || "",
    startAt: staffFormatDateTime_(event.getStartTime()),
    endAt: staffFormatDateTime_(event.getEndTime()),
    duration: Math.round((event.getEndTime().getTime() - event.getStartTime().getTime()) / 60000),
    type: type,
    notes: metadata.notes || "",
    status: "confirmed",
    source: "google-calendar",
    isManaged: Boolean(metadata.version)
  };
}

function staffWriteMetadata_(event, reservation) {
  const metadata = {
    version: 1,
    customerName: reservation.customerName,
    trainerId: reservation.trainerId,
    type: reservation.type,
    notes: reservation.notes
  };
  event.setDescription((reservation.notes || "") + STAFF_META_MARKER + JSON.stringify(metadata));
}

function staffReadMetadata_(description) {
  const value = String(description || "");
  const markerIndex = value.lastIndexOf(STAFF_META_MARKER);
  if (markerIndex < 0) return {};
  try {
    return JSON.parse(value.slice(markerIndex + STAFF_META_MARKER.length));
  } catch (error) {
    return {};
  }
}

function staffTitle_(reservation) {
  const trainer = STAFF_TRAINERS[reservation.trainerId];
  if (reservation.type === "blocked") return "【" + trainer + "】【予定】" + reservation.customerName;
  const label = reservation.type === "trial" ? "体験" : reservation.type === "consultation" ? "見学・相談" : "会員";
  return "【" + trainer + "】【" + label + "】" + reservation.customerName + "様";
}

function staffInferType_(title) {
  if (title.indexOf("予定") >= 0) return "blocked";
  if (title.indexOf("体験") >= 0) return "trial";
  if (title.indexOf("相談") >= 0 || title.indexOf("見学") >= 0) return "consultation";
  return "member";
}

function staffNameFromTitle_(title) {
  return String(title || "")
    .replace(/【[^】]*】/g, "")
    .replace(/様$/, "")
    .trim() || "予定";
}

function staffCalendar_() {
  const calendar = CalendarApp.getCalendarById(STAFF_CALENDAR_ID);
  if (!calendar) throw new Error("Googleカレンダーを開けませんでした。カレンダーIDを確認してください。");
  return calendar;
}

function staffParseDateTime_(value) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) {
    throw new Error("日時の形式を確認してください。");
  }
  const date = new Date(text + "+09:00");
  if (isNaN(date.getTime())) throw new Error("日時を確認してください。");
  return date;
}

function staffDayStart_(dateText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateText || ""))) throw new Error("日付を確認してください。");
  return new Date(String(dateText) + "T00:00:00+09:00");
}

function staffDayAfter_(dateText) {
  const date = staffDayStart_(dateText);
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

function staffFormatDateTime_(date) {
  return Utilities.formatDate(date, STAFF_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function staffWithLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function staffCacheVersion_() {
  return PropertiesService.getScriptProperties().getProperty(STAFF_CACHE_VERSION_KEY) || "0";
}

function staffBumpCacheVersion_() {
  const version = Number(staffCacheVersion_()) || 0;
  PropertiesService.getScriptProperties().setProperty(STAFF_CACHE_VERSION_KEY, String(version + 1));
}

function staffResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function staffErrorResponse_(error) {
  console.error(error);
  return staffResponse_({ status: "error", message: error && error.message ? error.message : String(error) });
}
