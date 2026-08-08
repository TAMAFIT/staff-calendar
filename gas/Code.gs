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
const STAFF_AUDIT_PREFIX = "tamafit_staff_calendar_audit_";
const STAFF_AUDIT_MAX_ENTRIES = 50;
const STAFF_SNAPSHOT_PREFIX = "tamafit_staff_calendar_snapshot_";
const STAFF_SNAPSHOT_INITIALIZED_KEY = "tamafit_staff_calendar_snapshot_initialized_at";
const STAFF_SNAPSHOT_MAX_ENTRIES = 100;
const STAFF_TRAINERS = {
  tamai: "玉井",
  obayashi: "大林"
};
const STAFF_TYPES = {
  member: "通常予約",
  trial: "体験",
  consultation: "見学・相談",
  blocked: "予約ブロック",
  tentative: "仮予約枠",
  event: "イベント"
};
const STAFF_OPERATORS = {
  tamai: "玉井",
  obayashi: "大林",
  store: "店舗用端末"
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

    if (action === "staffCalendarHistory") {
      return staffResponse_({ status: "success", entries: staffListAudit_(params.limit) });
    }

    if (action === "staffCalendarAuditSetup") {
      return staffResponse_({
        status: "success",
        historyReady: initializeStaffCalendarAudit()
      });
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
        const event = staffCreateEvent_(data.event || {}, data.operatorId);
        return { status: "success", event: event };
      }));
    }

    if (action === "staffCalendarUpdate") {
      return staffResponse_(staffWithLock_(function() {
        const event = staffUpdateEvent_(data.id, data.event || {}, data.operatorId);
        return { status: "success", event: event };
      }));
    }

    if (action === "staffCalendarDelete") {
      return staffResponse_(staffWithLock_(function() {
        staffDeleteEvent_(data.id, data.operatorId);
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
  staffReconcileDirectChanges_(events, startDate, endDate);
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

function staffCreateEvent_(input, operatorId) {
  const reservation = staffNormalizeInput_(input);
  staffEnsureNoConflict_(reservation, "");

  const event = staffCalendar_().createEvent(
    staffTitle_(reservation),
    staffParseDateTime_(reservation.startAt),
    staffParseDateTime_(reservation.endAt)
  );
  staffWriteMetadata_(event, reservation);
  const created = staffSerializeEvent_(event);
  staffWriteAudit_("作成", null, created, staffOperatorName_(operatorId));
  staffStoreSnapshot_(created);
  staffBumpCacheVersion_();
  return created;
}

function staffUpdateEvent_(id, input, operatorId) {
  if (!id) throw new Error("予約IDがありません。");
  const event = staffCalendar_().getEventById(String(id));
  if (!event) throw new Error("予約が見つかりませんでした。");
  const before = staffSerializeEvent_(event);

  const reservation = staffNormalizeInput_(input);
  staffEnsureNoConflict_(reservation, event.getId());
  event.setTitle(staffTitle_(reservation));
  event.setTime(staffParseDateTime_(reservation.startAt), staffParseDateTime_(reservation.endAt));
  staffWriteMetadata_(event, reservation);
  const updated = staffSerializeEvent_(event);
  staffWriteAudit_("変更", before, updated, staffOperatorName_(operatorId));
  staffStoreSnapshot_(updated);
  staffBumpCacheVersion_();
  return updated;
}

function staffDeleteEvent_(id, operatorId) {
  if (!id) throw new Error("予約IDがありません。");
  const event = staffCalendar_().getEventById(String(id));
  if (!event) throw new Error("予約が見つかりませんでした。");
  const deleted = staffSerializeEvent_(event);
  event.deleteEvent();
  staffWriteAudit_("削除", deleted, null, staffOperatorName_(operatorId));
  staffDeleteSnapshot_(deleted.id);
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

  if (trainerId && !STAFF_TRAINERS[trainerId]) throw new Error("担当トレーナーを確認してください。");
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
  if (!reservation.trainerId) return;
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
    notes: metadata.notes || staffPlainDescription_(event.getDescription()),
    status: "confirmed",
    source: "google-calendar",
    isManaged: Boolean(metadata.version),
    lastUpdated: event.getLastUpdated().getTime()
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

function staffPlainDescription_(description) {
  const value = String(description || "");
  const markerIndex = value.lastIndexOf(STAFF_META_MARKER);
  return (markerIndex < 0 ? value : value.slice(0, markerIndex)).trim();
}

function staffTitle_(reservation) {
  const trainer = STAFF_TRAINERS[reservation.trainerId];
  const trainerPrefix = trainer ? "【" + trainer + "】" : "";
  const labels = {
    member: "会員",
    trial: "体験",
    consultation: "見学・相談",
    blocked: "予定",
    tentative: "仮予約",
    event: "イベント"
  };
  const label = labels[reservation.type] || "予定";
  const honorific = ["member", "trial", "consultation"].includes(reservation.type) ? "様" : "";
  return trainerPrefix + "【" + label + "】" + reservation.customerName + honorific;
}

function staffInferType_(title) {
  if (title.indexOf("仮予約") >= 0 || title.indexOf("仮") >= 0) return "tentative";
  if (title.indexOf("イベント") >= 0) return "event";
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

function staffOperatorName_(operatorId) {
  return STAFF_OPERATORS[String(operatorId || "")] || "未設定端末";
}

function initializeStaffCalendarAudit() {
  const properties = PropertiesService.getScriptProperties();
  const probeKey = STAFF_AUDIT_PREFIX + "setup_probe";
  properties.setProperty(probeKey, "ready");
  properties.deleteProperty(probeKey);
  return true;
}

function staffWriteAudit_(action, before, after, source) {
  try {
    const current = after || before;
    if (!current) return;
    const now = new Date();
    const key = STAFF_AUDIT_PREFIX + now.getTime() + "_" + Utilities.getUuid();
    const entry = {
      timestamp: Utilities.formatDate(now, STAFF_TIMEZONE, "yyyy-MM-dd HH:mm:ss"),
      action: action,
      source: staffAuditText_(source || "スタッフカレンダー", 100),
      id: staffAuditText_(current.id, 300),
      customerName: staffAuditText_(current.customerName, 300),
      trainerName: STAFF_TRAINERS[current.trainerId] || "指定なし",
      startAt: staffAuditText_(current.startAt, 40),
      endAt: staffAuditText_(current.endAt, 40),
      typeName: staffAuditText_(STAFF_TYPES[current.type] || current.type, 100),
      notes: staffAuditText_(current.notes, 1000),
      beforeSummary: before && after ? staffAuditText_(staffAuditSummary_(before), 1500) : ""
    };
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(key, JSON.stringify(entry));
    staffTrimAudit_(properties);
  } catch (error) {
    // A history write must not prevent the reservation itself from being saved.
    console.error("操作履歴の記録に失敗しました", error);
  }
}

function staffAuditText_(value, maxLength) {
  return String(value || "").slice(0, maxLength);
}

function staffSnapshotKey_(id) {
  return STAFF_SNAPSHOT_PREFIX + String(id || "");
}

function staffSnapshotRecord_(event) {
  return {
    id: staffAuditText_(event.id, 300),
    customerName: staffAuditText_(event.customerName, 300),
    trainerId: staffAuditText_(event.trainerId, 30),
    startAt: staffAuditText_(event.startAt, 40),
    endAt: staffAuditText_(event.endAt, 40),
    duration: Number(event.duration || 0),
    type: staffAuditText_(event.type, 100),
    notes: staffAuditText_(event.notes, 1000),
    lastUpdated: Number(event.lastUpdated || 0),
    seenAt: Date.now()
  };
}

function staffSnapshotFingerprint_(event) {
  return JSON.stringify([
    event.customerName || "",
    event.trainerId || "",
    event.startAt || "",
    event.endAt || "",
    Number(event.duration || 0),
    event.type || "",
    event.notes || ""
  ]);
}

function staffReadSnapshot_(properties, key) {
  try {
    return JSON.parse(properties.getProperty(key) || "null");
  } catch (error) {
    properties.deleteProperty(key);
    return null;
  }
}

function staffSnapshotKeys_(properties) {
  return properties.getKeys().filter(function(key) {
    return key.indexOf(STAFF_SNAPSHOT_PREFIX) === 0 && key !== STAFF_SNAPSHOT_INITIALIZED_KEY;
  });
}

function staffStoreSnapshot_(event, suppliedProperties) {
  if (!event || !event.id) return;
  const properties = suppliedProperties || PropertiesService.getScriptProperties();
  properties.setProperty(staffSnapshotKey_(event.id), JSON.stringify(staffSnapshotRecord_(event)));
  if (!suppliedProperties) staffTrimSnapshots_(properties);
}

function staffDeleteSnapshot_(id, suppliedProperties) {
  const properties = suppliedProperties || PropertiesService.getScriptProperties();
  properties.deleteProperty(staffSnapshotKey_(id));
}

function staffTrimSnapshots_(properties) {
  staffSnapshotKeys_(properties)
    .map(function(key) { return { key: key, value: staffReadSnapshot_(properties, key) }; })
    .filter(function(item) { return item.value; })
    .sort(function(a, b) { return Number(b.value.seenAt || 0) - Number(a.value.seenAt || 0); })
    .slice(STAFF_SNAPSHOT_MAX_ENTRIES)
    .forEach(function(item) { properties.deleteProperty(item.key); });
}

function staffReconcileDirectChanges_(events, startDate, endDate) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(2000)) return;

  try {
    const properties = PropertiesService.getScriptProperties();
    const initializedAt = Number(properties.getProperty(STAFF_SNAPSHOT_INITIALIZED_KEY) || 0);
    const currentById = {};

    events.forEach(function(event) {
      currentById[event.id] = true;
      const key = staffSnapshotKey_(event.id);
      const previous = staffReadSnapshot_(properties, key);
      if (previous && staffSnapshotFingerprint_(previous) !== staffSnapshotFingerprint_(event)) {
        staffWriteAudit_("変更", previous, event, "Googleカレンダー直接操作");
      } else if (!previous && initializedAt && Number(event.lastUpdated || 0) >= initializedAt) {
        staffWriteAudit_("作成", null, event, "Googleカレンダー直接操作");
      }
      staffStoreSnapshot_(event, properties);
    });

    if (initializedAt) {
      staffSnapshotKeys_(properties).forEach(function(key) {
        const previous = staffReadSnapshot_(properties, key);
        if (!previous || currentById[previous.id]) return;
        const previousDate = String(previous.startAt || "").slice(0, 10);
        if (previousDate < startDate || previousDate > endDate) return;

        const liveEvent = staffCalendar_().getEventById(previous.id);
        if (!liveEvent) {
          staffWriteAudit_("削除", previous, null, "Googleカレンダー直接操作");
          staffDeleteSnapshot_(previous.id, properties);
          return;
        }

        const moved = staffSerializeEvent_(liveEvent);
        if (staffSnapshotFingerprint_(previous) !== staffSnapshotFingerprint_(moved)) {
          staffWriteAudit_("変更", previous, moved, "Googleカレンダー直接操作");
        }
        staffStoreSnapshot_(moved, properties);
      });
    } else {
      properties.setProperty(STAFF_SNAPSHOT_INITIALIZED_KEY, String(Date.now()));
    }

    staffTrimSnapshots_(properties);
  } catch (error) {
    console.error("Googleカレンダー直接操作の確認に失敗しました", error);
  } finally {
    lock.releaseLock();
  }
}

function staffAuditKeys_(properties) {
  return properties.getKeys().filter(function(key) {
    return key.indexOf(STAFF_AUDIT_PREFIX) === 0 && key !== STAFF_AUDIT_PREFIX + "setup_probe";
  }).sort().reverse();
}

function staffTrimAudit_(properties) {
  staffAuditKeys_(properties).slice(STAFF_AUDIT_MAX_ENTRIES).forEach(function(key) {
    properties.deleteProperty(key);
  });
}

function staffListAudit_(limit) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const count = Math.min(Math.max(Number(limit) || 50, 1), 50);
    return staffAuditKeys_(properties).slice(0, count).map(function(key) {
      return JSON.parse(properties.getProperty(key));
    });
  } catch (error) {
    console.error("操作履歴の読み込みに失敗しました", error);
    return [];
  }
}

function staffAuditSummary_(event) {
  return [
    event.customerName,
    STAFF_TRAINERS[event.trainerId] || "指定なし",
    event.startAt + "〜" + event.endAt,
    STAFF_TYPES[event.type] || event.type,
    event.notes || ""
  ].join(" / ");
}

function staffResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function staffErrorResponse_(error) {
  console.error(error);
  return staffResponse_({ status: "error", message: error && error.message ? error.message : String(error) });
}
