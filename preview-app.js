(() => {
  // src/config.js
  var APP_NAME = "\u305F\u307E\u30D5\u30A3\u30C3\u30C8\u4E88\u7D04";
  var GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQf3thjGYKpV13bH6V0n1ZKQT23Wvvx8K7CQhRNIuH6mAQwih9Cg28r3ETnz9AVB4Etw/exec";
  var TRAINERS = [
    { id: "tamai", name: "\u7389\u4E95", shortName: "\u7389\u4E95", color: "pink" },
    { id: "obayashi", name: "\u5927\u6797", shortName: "\u5927\u6797", color: "aqua" }
  ];
  var BOOKING_TYPES = [
    { id: "member", name: "\u901A\u5E38\u4E88\u7D04" },
    { id: "trial", name: "\u4F53\u9A13" },
    { id: "consultation", name: "\u898B\u5B66\u30FB\u76F8\u8AC7" },
    { id: "blocked", name: "\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF" },
    { id: "tentative", name: "\u4EEE\u4E88\u7D04\u67A0" },
    { id: "event", name: "\u30A4\u30D9\u30F3\u30C8" }
  ];
  var DURATIONS = [30, 60, 90];
  var OPENING_TIME = "09:00";
  var CLOSING_TIME = "21:00";
  var TIME_STEP_MINUTES = 15;
  var MONTH_EVENT_LIMIT = 5;

  // src/utils/date.js
  var WEEKDAYS_SHORT = ["\u65E5", "\u6708", "\u706B", "\u6C34", "\u6728", "\u91D1", "\u571F"];
  function pad(value) {
    return String(value).padStart(2, "0");
  }
  function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function parseISODate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  function isValidISODate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const date = parseISODate(value);
    return toISODate(date) === value;
  }
  function addDays(date, amount) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + amount);
    return next;
  }
  function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  }
  function startOfWeek(date) {
    return addDays(date, -date.getDay());
  }
  function getMonthGrid(anchorDate) {
    const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }
  function getWeekDays(anchorDate) {
    const start = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }
  function formatMonthTitle(date) {
    return `${date.getFullYear()}\u5E74${date.getMonth() + 1}\u6708`;
  }
  function formatDayTitle(date) {
    return `${date.getMonth() + 1}\u6708${date.getDate()}\u65E5\uFF08${WEEKDAYS_SHORT[date.getDay()]}\uFF09`;
  }
  function formatShortDay(date) {
    return `${date.getMonth() + 1}/${date.getDate()}\uFF08${WEEKDAYS_SHORT[date.getDay()]}\uFF09`;
  }
  function formatWeekRange(anchorDate) {
    const days = getWeekDays(anchorDate);
    const start = days[0];
    const end = days[6];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getMonth() + 1}/${start.getDate()}\u301C${end.getMonth() + 1}/${end.getDate()}`;
    }
    return `${start.getMonth() + 1}/${start.getDate()}\u301C${end.getMonth() + 1}/${end.getDate()}`;
  }
  function dateTimeToParts(value) {
    const [date = "", time = ""] = String(value).split("T");
    return { date, time: time.slice(0, 5) };
  }
  function combineDateAndTime(date, time) {
    return `${date}T${time}:00`;
  }
  function timeToMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }
  function minutesToTime(value) {
    return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
  }
  function addMinutesToDateTime(value, minutes) {
    const { date, time } = dateTimeToParts(value);
    return combineDateAndTime(date, minutesToTime(timeToMinutes(time) + minutes));
  }
  function createTimeOptions(start, end, step) {
    const options = [];
    for (let value = timeToMinutes(start); value <= timeToMinutes(end); value += step) {
      options.push(minutesToTime(value));
    }
    return options;
  }
  function isToday(date) {
    return toISODate(date) === toISODate(/* @__PURE__ */ new Date());
  }
  function monthRouteValue(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  }
  function parseMonthRoute(value) {
    if (!/^\d{4}-\d{2}$/.test(String(value))) return /* @__PURE__ */ new Date();
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  // src/router.js
  function parseRoute(hash = window.location.hash) {
    const raw = hash.replace(/^#\/?/, "");
    const [path = "", queryString = ""] = raw.split("?");
    const segments = path.split("/").filter(Boolean);
    const query = new URLSearchParams(queryString);
    const today = /* @__PURE__ */ new Date();
    if (segments[0] === "month") {
      return { name: "month", month: segments[1] || monthRouteValue(today) };
    }
    if (segments[0] === "week") {
      return { name: "week", date: segments[1] || toISODate(today) };
    }
    if (segments[0] === "day") {
      return { name: "day", date: segments[1] || toISODate(today) };
    }
    if (segments[0] === "booking" && segments[1] === "new") {
      return { name: "booking-new", date: query.get("date") || toISODate(today) };
    }
    if (segments[0] === "booking" && segments[1] === "edit" && segments[2]) {
      return { name: "booking-edit", id: decodeURIComponent(segments[2]) };
    }
    if (segments[0] === "history") {
      return { name: "history" };
    }
    return { name: "month", month: monthRouteValue(today) };
  }
  function navigate(path, { replace = false } = {}) {
    const nextHash = path.startsWith("#") ? path : `#/${path.replace(/^\//, "")}`;
    if (replace) {
      history.replaceState(null, "", nextHash);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return;
    }
    window.location.hash = nextHash;
  }

  // src/state.js
  var VIEW_STORAGE_KEY = "tamafit_staff_calendar_last_view";
  var OPERATOR_STORAGE_KEY = "tamafit_staff_calendar_operator_v1";
  var OPERATORS = [
    { id: "tamai", name: "\u7389\u4E95", trainerId: "tamai" },
    { id: "obayashi", name: "\u5927\u6797", trainerId: "obayashi" },
    { id: "store", name: "\u5E97\u8217\u7528\u7AEF\u672B", trainerId: "" }
  ];
  function loadOperatorId() {
    try {
      const value = globalThis.localStorage?.getItem(OPERATOR_STORAGE_KEY) || "";
      return OPERATORS.some((operator) => operator.id === value) ? value : "";
    } catch {
      return "";
    }
  }
  function getOperatorProfile() {
    const id = loadOperatorId();
    return OPERATORS.find((operator) => operator.id === id) || null;
  }
  function saveOperatorId(id) {
    if (!OPERATORS.some((operator) => operator.id === id)) return false;
    try {
      globalThis.localStorage?.setItem(OPERATOR_STORAGE_KEY, id);
      return true;
    } catch {
      return false;
    }
  }
  function saveLastView(view) {
    if (view !== "month" && view !== "week") return;
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
    }
  }
  var appState = {
    route: null,
    isLoading: false,
    installPrompt: null,
    isInstalled: false
  };

  // src/services/calendar-repository.js
  var CalendarRepository = class {
    async listEvents() {
      throw new Error("listEvents must be implemented");
    }
    async getEvent() {
      throw new Error("getEvent must be implemented");
    }
    async createEvent() {
      throw new Error("createEvent must be implemented");
    }
    async updateEvent() {
      throw new Error("updateEvent must be implemented");
    }
    async deleteEvent() {
      throw new Error("deleteEvent must be implemented");
    }
    async findConflicts() {
      throw new Error("findConflicts must be implemented");
    }
    async findBufferWarnings() {
      throw new Error("findBufferWarnings must be implemented");
    }
    async listHistory() {
      throw new Error("listHistory must be implemented");
    }
    async deleteHistory() {
      throw new Error("deleteHistory must be implemented");
    }
  };

  // src/services/booking-proximity.js
  var BOOKING_BUFFER_MINUTES = 30;
  function findBufferWarnings(events, candidate, excludeId = null, bufferMinutes = BOOKING_BUFFER_MINUTES) {
    if (!candidate.trainerId) return [];
    const candidateStart = Date.parse(candidate.startAt);
    const candidateEnd = Date.parse(candidate.endAt);
    const bufferMs = bufferMinutes * 60 * 1e3;
    if (!Number.isFinite(candidateStart) || !Number.isFinite(candidateEnd)) return [];
    return events.filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      const eventStart = Date.parse(event.startAt);
      const eventEnd = Date.parse(event.endAt);
      if (!Number.isFinite(eventStart) || !Number.isFinite(eventEnd)) return false;
      const gapAfterExisting = candidateStart - eventEnd;
      const gapBeforeExisting = eventStart - candidateEnd;
      return gapAfterExisting >= 0 && gapAfterExisting < bufferMs || gapBeforeExisting >= 0 && gapBeforeExisting < bufferMs;
    });
  }

  // src/services/google-calendar-repository.js
  var RECURRING_INSTANCE_PREFIX = "recurring:";
  function isConfigured(url) {
    return /^https:\/\/script\.google\.com\/macros\/s\//.test(String(url || ""));
  }
  function ensureConfigured(url) {
    if (isConfigured(url)) return;
    throw new Error("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u9023\u643A\u306EURL\u304C\u672A\u8A2D\u5B9A\u3067\u3059\u3002Apps Script\u3092\u30C7\u30D7\u30ED\u30A4\u3057\u3066\u304B\u3089 src/config.js \u306B /exec URL \u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  function isDefinitiveRejection(message) {
    return /同じ担当トレーナーに重複する予約があります|予約が見つかりませんでした|未対応の操作です|確認してください|入力してください|一致しません|予約IDがありません/.test(String(message || ""));
  }
  function ensureSuccess(payload, { mutation = false } = {}) {
    if (payload?.status === "success") return payload;
    const error = new Error(payload?.message || "Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
    error.retryable = typeof payload?.retryable === "boolean" ? payload.retryable : mutation && !isDefinitiveRejection(error.message);
    if (typeof payload?.code === "string") error.code = payload.code;
    throw error;
  }
  function connectionError(message, cause, { retryable = true } = {}) {
    const error = new Error(message);
    error.retryable = retryable;
    error.cause = cause;
    return error;
  }
  function withMutationId(data, mutationId) {
    return mutationId ? { ...data, mutationId } : data;
  }
  function normalizeExplicitRecurringEvent(event) {
    if (!event?.isRecurring) return event;
    const seriesId = String(event.calendarEventId || event.id || "");
    if (!seriesId || !event.startAt) return { ...event, isRecurring: true, readOnly: true };
    const currentId = String(event.id || "");
    const instanceId = currentId.startsWith(RECURRING_INSTANCE_PREFIX) ? currentId : `${RECURRING_INSTANCE_PREFIX}${encodeURIComponent(seriesId)}:${event.startAt}`;
    return {
      ...event,
      calendarEventId: seriesId,
      id: instanceId,
      isRecurring: true,
      readOnly: true
    };
  }
  var GoogleCalendarRepository = class extends CalendarRepository {
    constructor({ endpoint = GOOGLE_APPS_SCRIPT_URL, fetchImpl = (...args) => globalThis.fetch(...args) } = {}) {
      super();
      this.endpoint = endpoint;
      this.fetchImpl = fetchImpl;
    }
    async get(action, params = {}) {
      ensureConfigured(this.endpoint);
      const url = new URL(this.endpoint);
      url.searchParams.set("action", action);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) url.searchParams.set(key, value);
      });
      let response;
      try {
        response = await this.fetchImpl(url, { method: "GET", redirect: "follow" });
      } catch (error) {
        throw connectionError("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002", error);
      }
      if (!response.ok) throw connectionError("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      return ensureSuccess(await response.json());
    }
    async post(action, data = {}, { retryOnce = Boolean(data.mutationId) } = {}) {
      ensureConfigured(this.endpoint);
      const body = JSON.stringify({ action, operatorId: loadOperatorId(), ...data });
      const attempts = retryOnce ? 2 : 1;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const response = await this.fetchImpl(this.endpoint, {
            method: "POST",
            redirect: "follow",
            // Do not add a Content-Type header. This keeps the Apps Script request CORS-simple.
            body
          });
          if (!response.ok) {
            throw connectionError(`Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\uFF08HTTP ${response.status}\uFF09`);
          }
          return ensureSuccess(await response.json(), { mutation: Boolean(data.mutationId) });
        } catch (error) {
          if (error?.retryable === false) throw error;
          if (attempt + 1 < attempts) continue;
          if (error?.retryable) throw error;
          throw connectionError("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002", error);
        }
      }
      throw connectionError("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
    }
    async listEvents(startDate, endDate) {
      const response = await this.get("staffCalendarList", { startDate, endDate });
      return (response.events || []).map(normalizeExplicitRecurringEvent);
    }
    async getEvent(id) {
      const response = await this.get("staffCalendarGet", { id });
      return response.event ? normalizeExplicitRecurringEvent(response.event) : null;
    }
    async createEventWithHistory(input, { mutationId = "" } = {}) {
      const response = await this.post("staffCalendarCreate", withMutationId({ event: input }, mutationId));
      return { event: response.event, history: response.history || null };
    }
    async createEvent(input, options = {}) {
      return (await this.createEventWithHistory(input, options)).event;
    }
    async updateEventWithHistory(id, input, { mutationId = "" } = {}) {
      const response = await this.post("staffCalendarUpdate", withMutationId({ id, event: input }, mutationId));
      return { event: response.event, history: response.history || null };
    }
    async updateEvent(id, input, options = {}) {
      return (await this.updateEventWithHistory(id, input, options)).event;
    }
    async deleteEventWithHistory(id, { mutationId = "" } = {}) {
      const response = await this.post("staffCalendarDelete", withMutationId({ id }, mutationId));
      return { history: response.history || null };
    }
    async deleteEvent(id, options = {}) {
      await this.deleteEventWithHistory(id, options);
    }
    async findConflicts(candidate, excludeId = null) {
      if (!candidate.trainerId) return [];
      const date = candidate.startAt.slice(0, 10);
      const events = await this.listEvents(date, date);
      return events.filter((event) => {
        if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
        return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
      });
    }
    async findBufferWarnings(candidate, excludeId = null) {
      const date = candidate.startAt.slice(0, 10);
      return findBufferWarnings(await this.listEvents(date, date), candidate, excludeId);
    }
    async listHistory(limit = 50) {
      const response = await this.get("staffCalendarHistory", { limit });
      return response.entries || [];
    }
    async deleteHistoryResult(historyIds) {
      const response = await this.post("staffCalendarHistoryDelete", {
        historyIds: (Array.isArray(historyIds) ? historyIds : [historyIds]).map(String).filter(Boolean)
      }, { retryOnce: false });
      return {
        deleted: response.deleted || [],
        acknowledged: response.acknowledged || response.deleted || []
      };
    }
    async deleteHistory(historyIds) {
      return (await this.deleteHistoryResult(historyIds)).deleted;
    }
  };

  // src/data/mock-calendar.js
  var CUSTOMER_NAMES = [
    "\u5C71\u7530 \u82B1\u5B50",
    "\u4F50\u85E4 \u4E00\u90CE",
    "\u9234\u6728 \u7F8E\u9999",
    "\u9AD8\u6A4B \u5065",
    "\u4F0A\u85E4 \u548C\u5B50",
    "\u4E2D\u6751 \u76F4\u5B50",
    "\u5C0F\u6797 \u535A",
    "\u68EE\u4E95 \u6075",
    "\u91CE\u53E3 \u8AA0",
    "\u897F\u539F \u7531\u7F8E"
  ];
  var TIMES = ["09:30", "10:00", "11:30", "13:00", "14:30", "16:00", "18:00", "19:30"];
  function makeEvent({ id, date, time, duration = 60, customerName, trainerIndex, type = "member", notes = "" }) {
    const startAt = combineDateAndTime(date, time);
    return {
      id,
      customerName,
      trainerId: TRAINERS[trainerIndex % TRAINERS.length].id,
      startAt,
      endAt: addMinutesToDateTime(startAt, duration),
      duration,
      type,
      notes,
      status: "confirmed",
      source: "mock",
      createdAt: `${date}T08:00:00`,
      updatedAt: `${date}T08:00:00`
    };
  }
  function createMockEvents(anchorDate = /* @__PURE__ */ new Date()) {
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const events = [];
    const eventDays = [1, 3, 4, 5, 6, 8, 10, 11, 12, 14, 16, 18, 19, 20, 22, 25, 27, 29];
    let sequence = 1;
    eventDays.forEach((dayNumber, dayIndex) => {
      const date = toISODate(addDays(monthStart, dayNumber - 1));
      const count = dayNumber === 11 ? 7 : dayIndex % 4 + 1;
      for (let index = 0; index < count; index += 1) {
        events.push(makeEvent({
          id: `mock-${sequence}`,
          date,
          time: TIMES[(dayIndex + index) % TIMES.length],
          duration: index % 3 === 0 ? 30 : 60,
          customerName: CUSTOMER_NAMES[(dayIndex * 2 + index) % CUSTOMER_NAMES.length],
          trainerIndex: dayIndex + index,
          type: dayNumber === 11 && index === 1 ? "trial" : "member",
          notes: index === 0 && dayIndex % 3 === 0 ? "\u59FF\u52E2\u3068\u80A9\u307E\u308F\u308A\u3092\u78BA\u8A8D" : ""
        }));
        sequence += 1;
      }
    });
    const blockDate = toISODate(addDays(monthStart, 20));
    events.push(makeEvent({
      id: `mock-${sequence}`,
      date: blockDate,
      time: "12:00",
      duration: 90,
      customerName: "\u30B9\u30BF\u30C3\u30D5\u4E88\u5B9A",
      trainerIndex: 0,
      type: "blocked"
    }));
    return events;
  }
  function getBookingType(typeId) {
    return BOOKING_TYPES.find((type) => type.id === typeId) || BOOKING_TYPES[0];
  }

  // src/services/local-calendar-repository.js
  var STORAGE_KEY = "tamafit_staff_calendar_events_v1";
  var HISTORY_STORAGE_KEY = "tamafit_staff_calendar_history_v1";
  function makeId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  var LocalCalendarRepository = class extends CalendarRepository {
    constructor(storage = globalThis.localStorage) {
      super();
      this.storage = storage;
    }
    readAll() {
      try {
        const saved = this.storage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
      }
      const seeded = createMockEvents();
      this.writeAll(seeded);
      return seeded;
    }
    writeAll(events) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(events));
      } catch {
      }
    }
    readHistory() {
      try {
        const saved = JSON.parse(this.storage.getItem(HISTORY_STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
      } catch {
        return [];
      }
    }
    writeHistory(entries) {
      try {
        this.storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
      } catch {
      }
    }
    addHistory(action, before, after) {
      const current = after || before;
      if (!current) return;
      this.writeHistory([{
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action,
        source: getOperatorProfile()?.name || "\u672A\u8A2D\u5B9A\u7AEF\u672B",
        id: current.id,
        customerName: current.customerName,
        trainerName: current.trainerId === "tamai" ? "\u7389\u4E95" : current.trainerId === "obayashi" ? "\u5927\u6797" : "\u6307\u5B9A\u306A\u3057",
        startAt: current.startAt,
        endAt: current.endAt,
        typeName: { member: "\u901A\u5E38\u4E88\u7D04", trial: "\u4F53\u9A13", consultation: "\u898B\u5B66\u30FB\u76F8\u8AC7", blocked: "\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF", tentative: "\u4EEE\u4E88\u7D04\u67A0", event: "\u30A4\u30D9\u30F3\u30C8" }[current.type] || current.type,
        notes: current.notes || "",
        beforeSummary: before && after ? `${before.startAt}\u301C${before.endAt} / ${before.customerName}` : ""
      }, ...this.readHistory()]);
    }
    async listEvents(startDate, endDate) {
      return this.readAll().filter((event) => event.startAt.slice(0, 10) >= startDate && event.startAt.slice(0, 10) <= endDate).sort((a, b) => a.startAt.localeCompare(b.startAt));
    }
    async getEvent(id) {
      return this.readAll().find((event) => event.id === id) || null;
    }
    async createEvent(input) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const event = {
        ...input,
        id: makeId(),
        status: "confirmed",
        source: "staff-calendar",
        createdAt: now,
        updatedAt: now
      };
      const events = this.readAll();
      events.push(event);
      this.writeAll(events);
      this.addHistory("\u4F5C\u6210", null, event);
      return event;
    }
    async updateEvent(id, input) {
      const events = this.readAll();
      const index = events.findIndex((event) => event.id === id);
      if (index < 0) throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      const before = { ...events[index] };
      events[index] = { ...events[index], ...input, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      this.writeAll(events);
      this.addHistory("\u5909\u66F4", before, events[index]);
      return events[index];
    }
    async deleteEvent(id) {
      const events = this.readAll();
      const deleted = events.find((event) => event.id === id);
      const next = events.filter((event) => event.id !== id);
      if (next.length === events.length) throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      this.writeAll(next);
      this.addHistory("\u524A\u9664", deleted, null);
    }
    async findConflicts(candidate, excludeId = null) {
      if (!candidate.trainerId) return [];
      return this.readAll().filter((event) => {
        if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
        return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
      });
    }
    async findBufferWarnings(candidate, excludeId = null) {
      return findBufferWarnings(this.readAll(), candidate, excludeId);
    }
    async listHistory(limit = 50) {
      return this.readHistory().slice(0, limit);
    }
    async resetDemoData() {
      const seeded = createMockEvents();
      this.writeAll(seeded);
      return seeded;
    }
  };

  // src/services/cached-calendar-repository.js
  var CACHE_TTL_MS = 2e4;
  var MAX_SNAPSHOTS = 4;
  function canUseStorage(storage) {
    return storage && typeof storage.getItem === "function" && typeof storage.setItem === "function";
  }
  function rangeContains(snapshot, startDate, endDate) {
    return snapshot.startDate <= startDate && snapshot.endDate >= endDate;
  }
  function eventDate(event) {
    return String(event?.startAt || "").slice(0, 10);
  }
  function eventsForRange(events, startDate, endDate) {
    return events.filter((event) => eventDate(event) >= startDate && eventDate(event) <= endDate).sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  function createMutationId(kind) {
    const random = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    return `${kind}-${Date.now()}-${random}`;
  }
  function hasConflict(events, candidate, excludeId = null) {
    if (!candidate.trainerId) return [];
    return events.filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
    });
  }
  var CachedCalendarRepository = class extends CalendarRepository {
    constructor(source, {
      storage = globalThis.localStorage,
      storageKey = "tamafit_staff_calendar_cache_v1",
      now = () => Date.now(),
      ttlMs = CACHE_TTL_MS
    } = {}) {
      super();
      this.source = source;
      this.storage = storage;
      this.storageKey = storageKey;
      this.now = now;
      this.ttlMs = ttlMs;
      this.pendingRequests = /* @__PURE__ */ new Map();
      this.cacheGeneration = 0;
      this.snapshots = this.readSnapshots();
    }
    readSnapshots() {
      if (!canUseStorage(this.storage)) return [];
      try {
        const saved = JSON.parse(this.storage.getItem(this.storageKey) || "[]");
        return Array.isArray(saved) ? saved.filter((snapshot) => snapshot && Array.isArray(snapshot.events) && snapshot.startDate && snapshot.endDate && snapshot.fetchedAt !== void 0).map((snapshot) => ({
          ...snapshot,
          // A page reload may interrupt an in-flight request. Keep showing the optimistic
          // value but force an immediate revalidation so Google remains authoritative.
          fetchedAt: snapshot.events.some((event) => event.status === "pending") ? 0 : snapshot.fetchedAt
        })) : [];
      } catch {
        return [];
      }
    }
    writeSnapshots() {
      if (!canUseStorage(this.storage)) return;
      try {
        this.storage.setItem(this.storageKey, JSON.stringify(this.snapshots));
      } catch {
      }
    }
    getCachedEvents(startDate, endDate) {
      const snapshot = this.snapshots.filter((item) => rangeContains(item, startDate, endDate)).sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
      if (!snapshot) return null;
      return {
        events: eventsForRange(snapshot.events, startDate, endDate),
        fetchedAt: snapshot.fetchedAt,
        isFresh: this.now() - snapshot.fetchedAt < this.ttlMs
      };
    }
    async listEvents(startDate, endDate) {
      const cached = this.getCachedEvents(startDate, endDate);
      if (cached?.isFresh) return cached.events;
      return this.refreshEvents(startDate, endDate);
    }
    async refreshEvents(startDate, endDate) {
      const requestKey = `${startDate}:${endDate}`;
      if (this.pendingRequests.has(requestKey)) return this.pendingRequests.get(requestKey);
      const generation = this.cacheGeneration;
      const request = this.source.listEvents(startDate, endDate).then((events) => {
        if (generation !== this.cacheGeneration) {
          return this.getCachedEvents(startDate, endDate)?.events || eventsForRange(events, startDate, endDate);
        }
        const snapshot = {
          startDate,
          endDate,
          events: [...events].sort((a, b) => a.startAt.localeCompare(b.startAt)),
          fetchedAt: this.now()
        };
        this.snapshots = [snapshot, ...this.snapshots.filter((item) => item.startDate !== startDate || item.endDate !== endDate)].slice(0, MAX_SNAPSHOTS);
        this.writeSnapshots();
        return eventsForRange(snapshot.events, startDate, endDate);
      }).finally(() => this.pendingRequests.delete(requestKey));
      this.pendingRequests.set(requestKey, request);
      return request;
    }
    invalidate() {
      this.cacheGeneration += 1;
      this.snapshots = [];
      this.pendingRequests.clear();
      if (!canUseStorage(this.storage)) return;
      try {
        this.storage.removeItem(this.storageKey);
      } catch {
      }
    }
    updateCachedEvents({ removeIds = [], upsertEvents = [] } = {}) {
      this.cacheGeneration += 1;
      const idsToRemove = new Set(removeIds.filter(Boolean));
      upsertEvents.forEach((event) => {
        if (event?.id) idsToRemove.add(event.id);
      });
      let snapshots = this.snapshots.map((snapshot) => {
        let changed = snapshot.events.some((event) => idsToRemove.has(event.id));
        const nextEvents = snapshot.events.filter((event) => !idsToRemove.has(event.id));
        upsertEvents.forEach((event) => {
          const date = eventDate(event);
          if (date && rangeContains(snapshot, date, date)) {
            nextEvents.push(event);
            changed = true;
          }
        });
        if (!changed) return snapshot;
        return {
          ...snapshot,
          events: nextEvents.sort((a, b) => a.startAt.localeCompare(b.startAt)),
          fetchedAt: this.now()
        };
      });
      upsertEvents.forEach((event) => {
        const date = eventDate(event);
        if (!date || snapshots.some((snapshot) => rangeContains(snapshot, date, date))) return;
        snapshots.unshift({
          startDate: date,
          endDate: date,
          events: [event],
          fetchedAt: this.now()
        });
      });
      this.snapshots = snapshots.slice(0, MAX_SNAPSHOTS);
      this.writeSnapshots();
    }
    async getEvent(id) {
      const cached = this.snapshots.flatMap((snapshot) => snapshot.events).find((event) => event.id === id);
      return cached || this.source.getEvent(id);
    }
    async createEvent(input) {
      const event = await this.source.createEvent(input);
      this.updateCachedEvents({ upsertEvents: [event] });
      return event;
    }
    async updateEvent(id, input) {
      const event = await this.source.updateEvent(id, input);
      this.updateCachedEvents({ removeIds: [id], upsertEvents: [event] });
      return event;
    }
    async deleteEvent(id) {
      await this.source.deleteEvent(id);
      this.updateCachedEvents({ removeIds: [id] });
    }
    analyzeCachedBooking(candidate, excludeId = null) {
      const date = candidate.startAt.slice(0, 10);
      const cached = this.getCachedEvents(date, date);
      if (!cached) return null;
      return {
        conflicts: hasConflict(cached.events, candidate, excludeId),
        bufferWarnings: findBufferWarnings(cached.events, candidate, excludeId),
        events: cached.events,
        isFresh: cached.isFresh
      };
    }
    async analyzeBooking(candidate, excludeId = null) {
      const cachedAnalysis = this.analyzeCachedBooking(candidate, excludeId);
      if (cachedAnalysis) return cachedAnalysis;
      const date = candidate.startAt.slice(0, 10);
      const events = await this.refreshEvents(date, date);
      return {
        conflicts: hasConflict(events, candidate, excludeId),
        bufferWarnings: findBufferWarnings(events, candidate, excludeId),
        events,
        isFresh: true
      };
    }
    async findConflicts(candidate, excludeId = null) {
      return (await this.analyzeBooking(candidate, excludeId)).conflicts;
    }
    async findBufferWarnings(candidate, excludeId = null) {
      return (await this.analyzeBooking(candidate, excludeId)).bufferWarnings;
    }
    createEventOptimistic(input) {
      const mutationId = createMutationId("create");
      const optimisticEvent = {
        id: `pending:${mutationId}`,
        ...input,
        status: "pending",
        source: "optimistic",
        isManaged: true,
        lastUpdated: this.now()
      };
      this.updateCachedEvents({ upsertEvents: [optimisticEvent] });
      const committed = this.source.createEvent(input, { mutationId }).then((event) => {
        this.updateCachedEvents({ removeIds: [optimisticEvent.id], upsertEvents: [event] });
        return event;
      }).catch((error) => {
        this.updateCachedEvents({ removeIds: [optimisticEvent.id] });
        throw error;
      });
      return { event: optimisticEvent, committed, mutationId };
    }
    async updateEventOptimistic(id, input) {
      const previous = await this.getEvent(id);
      if (!previous) throw new Error("\u5909\u66F4\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      const mutationId = createMutationId("update");
      const optimisticEvent = {
        ...previous,
        ...input,
        id,
        status: "pending",
        source: "optimistic",
        lastUpdated: this.now()
      };
      this.updateCachedEvents({ removeIds: [id], upsertEvents: [optimisticEvent] });
      const committed = this.source.updateEvent(id, input, { mutationId }).then((event) => {
        this.updateCachedEvents({ removeIds: [id], upsertEvents: [event] });
        return event;
      }).catch((error) => {
        this.updateCachedEvents({ removeIds: [id], upsertEvents: [previous] });
        throw error;
      });
      return { event: optimisticEvent, previous, committed, mutationId };
    }
    async deleteEventOptimistic(id) {
      const previous = await this.getEvent(id);
      if (!previous) throw new Error("\u524A\u9664\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      const mutationId = createMutationId("delete");
      this.updateCachedEvents({ removeIds: [id] });
      const committed = this.source.deleteEvent(id, { mutationId }).then(() => previous).catch((error) => {
        this.updateCachedEvents({ upsertEvents: [previous] });
        throw error;
      });
      return { event: previous, committed, mutationId };
    }
    async listHistory(limit = 50) {
      return this.source.listHistory(limit);
    }
  };

  // src/history-data.js
  function historySemanticKey(entry) {
    return [
      entry?.action || "",
      entry?.customerName || "",
      entry?.startAt || "",
      entry?.endAt || "",
      entry?.beforeSummary || ""
    ].join("|");
  }

  // src/services/local-first-calendar-repository.js
  var DEFAULT_TTL_MS = 3e4;
  var MAX_COVERAGE = 24;
  var MAX_HISTORY = 50;
  var RETRY_DELAYS = [1500, 4e3, 1e4, 3e4, 6e4];
  function safeParse(storage, key, fallback) {
    try {
      const value = JSON.parse(storage?.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }
  function safeWrite(storage, key, value) {
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
    }
  }
  function makeId2(prefix) {
    const random = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${Date.now()}-${random}`;
  }
  function eventDate2(event) {
    return String(event?.startAt || "").slice(0, 10);
  }
  function inRange(event, startDate, endDate) {
    const date = eventDate2(event);
    return date >= startDate && date <= endDate;
  }
  function sortEvents(events) {
    return [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  function trainerName(id) {
    if (id === "tamai") return "\u7389\u4E95";
    if (id === "obayashi") return "\u5927\u6797";
    return "\u6307\u5B9A\u306A\u3057";
  }
  function typeName(type) {
    return {
      member: "\u901A\u5E38\u4E88\u7D04",
      trial: "\u4F53\u9A13",
      consultation: "\u898B\u5B66\u30FB\u76F8\u8AC7",
      blocked: "\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF",
      tentative: "\u4EEE\u4E88\u7D04\u67A0",
      event: "\u30A4\u30D9\u30F3\u30C8"
    }[type] || type || "\u4E88\u5B9A";
  }
  function hasConflict2(events, candidate, excludeId = null) {
    if (!candidate.trainerId) return [];
    return events.filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
    });
  }
  var LocalFirstCalendarRepository = class extends CalendarRepository {
    constructor(source, {
      storage = globalThis.localStorage,
      storageKey = "tamafit_staff_calendar_local_first_v1",
      now = () => Date.now(),
      ttlMs = DEFAULT_TTL_MS
    } = {}) {
      super();
      this.source = source;
      this.storage = storage;
      this.storageKey = storageKey;
      this.now = now;
      this.ttlMs = ttlMs;
      this.recordsKey = `${storageKey}:records`;
      this.coverageKey = `${storageKey}:coverage`;
      this.outboxKey = `${storageKey}:outbox`;
      this.historyKey = `${storageKey}:history`;
      this.records = safeParse(storage, this.recordsKey, []);
      this.coverage = safeParse(storage, this.coverageKey, []);
      this.outbox = safeParse(storage, this.outboxKey, []);
      this.history = safeParse(storage, this.historyKey, []);
      this.listeners = /* @__PURE__ */ new Set();
      this.syncing = false;
      this.retryTimer = null;
      this.refreshes = /* @__PURE__ */ new Map();
      this.migrateLegacyCache();
      queueMicrotask(() => this.syncNow());
    }
    migrateLegacyCache() {
      if (this.records.length) return;
      const legacy = safeParse(this.storage, "tamafit_staff_calendar_google_cache_v1", []);
      if (!Array.isArray(legacy) || !legacy.length) return;
      const byId = /* @__PURE__ */ new Map();
      legacy.forEach((snapshot) => {
        (snapshot?.events || []).forEach((event) => byId.set(event.id, event));
      });
      this.records = sortEvents([...byId.values()]);
      this.coverage = legacy.filter((item) => item?.startDate && item?.endDate).map((item) => ({ startDate: item.startDate, endDate: item.endDate, fetchedAt: item.fetchedAt || 0 })).slice(0, MAX_COVERAGE);
      this.persist();
    }
    persist() {
      safeWrite(this.storage, this.recordsKey, this.records);
      safeWrite(this.storage, this.coverageKey, this.coverage);
      safeWrite(this.storage, this.outboxKey, this.outbox);
      safeWrite(this.storage, this.historyKey, this.history.slice(0, MAX_HISTORY));
    }
    onSyncFailure(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    emitFailure(detail) {
      this.listeners.forEach((listener) => {
        try {
          listener(detail);
        } catch {
        }
      });
    }
    getCachedEvents(startDate, endDate) {
      const covering = this.coverage.filter((item) => item.startDate <= startDate && item.endDate >= endDate).sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
      return {
        events: sortEvents(this.records.filter((event) => inRange(event, startDate, endDate))),
        fetchedAt: covering?.fetchedAt || 0,
        isFresh: Boolean(covering && this.now() - covering.fetchedAt < this.ttlMs)
      };
    }
    getEventCached(id) {
      return this.records.find((event) => event.id === id) || null;
    }
    getCachedHistory() {
      return this.history.slice(0, MAX_HISTORY);
    }
    async listEvents(startDate, endDate) {
      return this.getCachedEvents(startDate, endDate).events;
    }
    async getEvent(id) {
      const cached = this.getEventCached(id);
      if (cached) return cached;
      const event = await this.source.getEvent(id);
      if (event) this.upsertRecord(event);
      return event;
    }
    async refreshEvents(startDate, endDate) {
      const key = `${startDate}:${endDate}`;
      if (this.refreshes.has(key)) return this.refreshes.get(key);
      const request = this.source.listEvents(startDate, endDate).then((serverEvents) => {
        const lockedIds = new Set(
          this.outbox.filter((op) => op.kind === "update" || op.kind === "delete").map((op) => op.targetId)
        );
        const localPending = this.records.filter((event) => inRange(event, startDate, endDate) && (event.syncState === "pending" || lockedIds.has(event.id) || String(event.id).startsWith("local:")));
        const outside = this.records.filter((event) => !inRange(event, startDate, endDate));
        const filteredServer = serverEvents.filter((event) => !lockedIds.has(event.id));
        const merged = /* @__PURE__ */ new Map();
        [...outside, ...filteredServer, ...localPending].forEach((event) => merged.set(event.id, event));
        this.records = sortEvents([...merged.values()]);
        this.coverage = [
          { startDate, endDate, fetchedAt: this.now() },
          ...this.coverage.filter((item) => item.startDate !== startDate || item.endDate !== endDate)
        ].slice(0, MAX_COVERAGE);
        this.persist();
        return this.getCachedEvents(startDate, endDate).events;
      }).finally(() => this.refreshes.delete(key));
      this.refreshes.set(key, request);
      return request;
    }
    refreshHistory() {
      return this.source.listHistory(MAX_HISTORY).then((entries) => {
        const localPending = this.history.filter((entry) => entry.localOnly);
        const seen = /* @__PURE__ */ new Set();
        this.history = [...localPending, ...entries].filter((entry) => {
          const key = `${entry.timestamp}|${entry.action}|${entry.id}|${entry.customerName}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, MAX_HISTORY);
        this.persist();
        return this.history;
      });
    }
    async listHistory(limit = MAX_HISTORY) {
      return this.history.slice(0, limit);
    }
    upsertRecord(event, removeId = "") {
      const remove = new Set([removeId, event?.id].filter(Boolean));
      this.records = sortEvents([
        ...this.records.filter((item) => !remove.has(item.id)),
        ...event ? [event] : []
      ]);
      this.persist();
    }
    removeRecord(id) {
      this.records = this.records.filter((event) => event.id !== id);
      this.persist();
    }
    appendLocalHistory(action, before, after) {
      const current = after || before;
      if (!current) return;
      const now = new Date(this.now()).toISOString();
      this.history = [{
        timestamp: now,
        action,
        source: getOperatorProfile()?.name || "\u672A\u8A2D\u5B9A\u7AEF\u672B",
        id: current.id,
        customerName: current.customerName,
        trainerName: trainerName(current.trainerId),
        startAt: current.startAt,
        endAt: current.endAt,
        typeName: typeName(current.type),
        notes: current.notes || "",
        beforeSummary: before && after ? `${before.startAt}\u301C${before.endAt} / ${before.customerName}` : "",
        localOnly: true
      }, ...this.history].slice(0, MAX_HISTORY);
      this.persist();
    }
    analyzeCachedBooking(candidate, excludeId = null) {
      const date = candidate.startAt.slice(0, 10);
      const events = this.getCachedEvents(date, date).events;
      return {
        conflicts: hasConflict2(events, candidate, excludeId),
        bufferWarnings: findBufferWarnings(events, candidate, excludeId),
        events
      };
    }
    async analyzeBooking(candidate, excludeId = null) {
      return this.analyzeCachedBooking(candidate, excludeId);
    }
    async findConflicts(candidate, excludeId = null) {
      return this.analyzeCachedBooking(candidate, excludeId).conflicts;
    }
    async findBufferWarnings(candidate, excludeId = null) {
      return this.analyzeCachedBooking(candidate, excludeId).bufferWarnings;
    }
    createEventOptimistic(input) {
      const mutationId = makeId2("create");
      const localId = `local:${mutationId}`;
      const event = {
        ...input,
        id: localId,
        status: "confirmed",
        syncState: "pending",
        source: "local-first",
        isManaged: true,
        lastUpdated: this.now()
      };
      this.upsertRecord(event);
      this.appendLocalHistory("\u4F5C\u6210", null, event);
      this.outbox.push({
        id: mutationId,
        kind: "create",
        targetId: localId,
        input,
        before: null,
        createdAt: this.now(),
        attempts: 0,
        notified: false
      });
      this.persist();
      queueMicrotask(() => this.syncNow());
      return { event, mutationId };
    }
    updateEventOptimistic(id, input) {
      const before = this.getEventCached(id);
      if (!before) throw new Error("\u5909\u66F4\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      const mutationId = makeId2("update");
      const event = {
        ...before,
        ...input,
        id,
        status: "confirmed",
        syncState: "pending",
        source: "local-first",
        lastUpdated: this.now()
      };
      this.upsertRecord(event);
      this.appendLocalHistory("\u5909\u66F4", before, event);
      this.outbox.push({
        id: mutationId,
        kind: "update",
        targetId: id,
        input,
        before,
        createdAt: this.now(),
        attempts: 0,
        notified: false
      });
      this.persist();
      queueMicrotask(() => this.syncNow());
      return { event, previous: before, mutationId };
    }
    deleteEventOptimistic(id) {
      const before = this.getEventCached(id);
      if (!before) throw new Error("\u524A\u9664\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      const mutationId = makeId2("delete");
      this.removeRecord(id);
      this.appendLocalHistory("\u524A\u9664", before, null);
      this.outbox.push({
        id: mutationId,
        kind: "delete",
        targetId: id,
        input: null,
        before,
        createdAt: this.now(),
        attempts: 0,
        notified: false
      });
      this.persist();
      queueMicrotask(() => this.syncNow());
      return { event: before, mutationId };
    }
    async createEvent(input) {
      return this.createEventOptimistic(input).event;
    }
    async updateEvent(id, input) {
      return this.updateEventOptimistic(id, input).event;
    }
    async deleteEvent(id) {
      this.deleteEventOptimistic(id);
    }
    rewriteTargetId(oldId, newId) {
      this.outbox.forEach((op) => {
        if (op.targetId === oldId) op.targetId = newId;
        if (op.before?.id === oldId) op.before = { ...op.before, id: newId };
      });
    }
    rollback(op, error) {
      if (op.kind === "create") {
        this.removeRecord(op.targetId);
      } else if (op.before) {
        this.upsertRecord({ ...op.before, syncState: void 0 });
      }
      this.outbox = this.outbox.filter((item) => item.id !== op.id);
      this.persist();
      this.emitFailure({ op, error, rolledBack: true });
    }
    scheduleRetry(op, error) {
      op.attempts = Number(op.attempts || 0) + 1;
      const index = Math.min(op.attempts - 1, RETRY_DELAYS.length - 1);
      op.nextAttemptAt = this.now() + RETRY_DELAYS[index];
      if (op.attempts >= 3 && !op.notified) {
        op.notified = true;
        this.emitFailure({ op, error, rolledBack: false, deferred: true });
      }
      this.persist();
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.syncNow(), RETRY_DELAYS[index]);
    }
    async syncOperation(op) {
      if (op.kind === "create") {
        const serverEvent = await this.source.createEvent(op.input, { mutationId: op.id });
        const oldId = op.targetId;
        const later = this.outbox.slice(1).filter((item) => item.targetId === oldId);
        this.rewriteTargetId(oldId, serverEvent.id);
        const current = this.getEventCached(oldId);
        this.removeRecord(oldId);
        if (!later.some((item) => item.kind === "delete")) {
          this.upsertRecord(later.length && current ? { ...current, id: serverEvent.id, syncState: "pending", source: "local-first" } : { ...serverEvent, syncState: void 0 });
        }
        return;
      }
      if (op.kind === "update") {
        const serverEvent = await this.source.updateEvent(op.targetId, op.input, { mutationId: op.id });
        const hasLater = this.outbox.slice(1).some((item) => item.targetId === op.targetId);
        if (!hasLater) this.upsertRecord({ ...serverEvent, syncState: void 0 });
        return;
      }
      if (op.kind === "delete") {
        await this.source.deleteEvent(op.targetId, { mutationId: op.id });
      }
    }
    async syncNow() {
      if (this.syncing || !this.outbox.length) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      this.syncing = true;
      clearTimeout(this.retryTimer);
      try {
        while (this.outbox.length) {
          const op = this.outbox[0];
          if (op.nextAttemptAt && op.nextAttemptAt > this.now()) {
            this.scheduleRetry(op, new Error("\u518D\u8A66\u884C\u5F85\u3061"));
            break;
          }
          try {
            await this.syncOperation(op);
            this.outbox.shift();
            this.persist();
          } catch (error) {
            if (error?.retryable !== false) {
              this.scheduleRetry(op, error);
              break;
            }
            this.rollback(op, error);
          }
        }
      } finally {
        this.syncing = false;
      }
    }
  };

  // src/services/responsive-local-first-calendar-repository.js
  var BROAD_PREFETCH_DAYS = 90;
  var MONTH_GRID_SPAN_DAYS = 41;
  var RECURRING_INSTANCE_PREFIX2 = "recurring:";
  var MAX_HISTORY2 = 50;
  function rangeLengthDays(startDate, endDate) {
    return Math.round((parseISODate(endDate).getTime() - parseISODate(startDate).getTime()) / 864e5);
  }
  function monthDataRange(anchorDate) {
    const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const last = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    return {
      startDate: toISODate(first),
      endDate: toISODate(last)
    };
  }
  function normalizeCalendarReadRange(startDate, endDate) {
    const start = parseISODate(startDate);
    const end = parseISODate(endDate);
    const looksLikeMonthGrid = rangeLengthDays(startDate, endDate) === MONTH_GRID_SPAN_DAYS && start.getDay() === 0 && end.getDay() === 6;
    if (!looksLikeMonthGrid) return { startDate, endDate };
    const anchor = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return monthDataRange(anchor);
  }
  function recurringInstanceId(event) {
    return `${RECURRING_INSTANCE_PREFIX2}${encodeURIComponent(event.id)}:${event.startAt}`;
  }
  function readStoredSet(storage, key) {
    try {
      const value = JSON.parse(storage?.getItem(key) || "[]");
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch {
      return /* @__PURE__ */ new Set();
    }
  }
  function writeStoredSet(storage, key, set) {
    try {
      storage?.setItem(key, JSON.stringify([...set]));
    } catch {
    }
  }
  function isLocalHistoryId(value) {
    return String(value || "").startsWith("local:") || String(value || "").startsWith("local-legacy:");
  }
  function normalizeRecurringInstances(events, knownSeriesIds = /* @__PURE__ */ new Set()) {
    const counts = /* @__PURE__ */ new Map();
    events.forEach((event) => counts.set(event.id, (counts.get(event.id) || 0) + 1));
    counts.forEach((count, id) => {
      if (count > 1) knownSeriesIds.add(id);
    });
    return events.map((event) => {
      if (!knownSeriesIds.has(event.id)) return event;
      return {
        ...event,
        calendarEventId: event.id,
        id: recurringInstanceId(event),
        isRecurring: true,
        readOnly: true
      };
    });
  }
  function wrapRecurringAwareSource(source, knownSeriesIds) {
    return new Proxy(source, {
      get(target, property, receiver) {
        if (property === "listEvents") {
          return async (...args) => normalizeRecurringInstances(await target.listEvents(...args), knownSeriesIds);
        }
        const value = Reflect.get(target, property, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  }
  var ResponsiveLocalFirstCalendarRepository = class extends LocalFirstCalendarRepository {
    constructor(source, options = {}) {
      const knownRecurringSeriesIds = /* @__PURE__ */ new Set();
      super(wrapRecurringAwareSource(source, knownRecurringSeriesIds), options);
      this.knownRecurringSeriesIds = knownRecurringSeriesIds;
      this.changeListeners = /* @__PURE__ */ new Set();
      this.historyDeleteSyncing = false;
      this.historyHiddenIdsKey = `${this.storageKey}:history-hidden-ids`;
      this.historyHiddenMutationIdsKey = `${this.storageKey}:history-hidden-mutations`;
      this.historyHiddenSemanticKeysKey = `${this.storageKey}:history-hidden-semantic`;
      this.hiddenHistoryIds = readStoredSet(this.storage, this.historyHiddenIdsKey);
      this.hiddenHistoryMutationIds = readStoredSet(this.storage, this.historyHiddenMutationIdsKey);
      this.hiddenHistorySemanticKeys = readStoredSet(this.storage, this.historyHiddenSemanticKeysKey);
      this.ensureHistoryIds();
      queueMicrotask(() => this.syncHistoryDeletes());
    }
    onChange(listener) {
      this.changeListeners.add(listener);
      return () => this.changeListeners.delete(listener);
    }
    emitChange() {
      this.changeListeners.forEach((listener) => {
        try {
          listener();
        } catch {
        }
      });
    }
    getCachedEvents(startDate, endDate) {
      const range = normalizeCalendarReadRange(startDate, endDate);
      return super.getCachedEvents(range.startDate, range.endDate);
    }
    ensureHistoryIds() {
      let changed = false;
      this.history = this.history.map((entry, index) => {
        if (entry?.historyId) return entry;
        changed = true;
        const key = encodeURIComponent(historySemanticKey(entry)).slice(0, 180);
        return { ...entry, historyId: `local-legacy:${key}:${index}` };
      });
      if (changed) this.persist();
    }
    persistHistoryDeletionState() {
      writeStoredSet(this.storage, this.historyHiddenIdsKey, this.hiddenHistoryIds);
      writeStoredSet(this.storage, this.historyHiddenMutationIdsKey, this.hiddenHistoryMutationIds);
      writeStoredSet(this.storage, this.historyHiddenSemanticKeysKey, this.hiddenHistorySemanticKeys);
    }
    markNewestLocalHistory(mutationId) {
      const latest = this.history[0];
      if (!latest?.localOnly) return;
      this.history[0] = {
        ...latest,
        historyId: `local:${mutationId}`,
        mutationId
      };
      this.persist();
    }
    createEventOptimistic(input) {
      const result = super.createEventOptimistic(input);
      this.markNewestLocalHistory(result.mutationId);
      return result;
    }
    updateEventOptimistic(id, input) {
      const result = super.updateEventOptimistic(id, input);
      this.markNewestLocalHistory(result.mutationId);
      return result;
    }
    deleteEventOptimistic(id) {
      const result = super.deleteEventOptimistic(id);
      this.markNewestLocalHistory(result.mutationId);
      return result;
    }
    async refreshOneRange(startDate, endDate) {
      const cached = this.getCachedEvents(startDate, endDate);
      if (cached.isFresh) return cached.events;
      const events = await super.refreshEvents(startDate, endDate);
      this.emitChange();
      return events;
    }
    async prefetchCurrentAndNextMonth() {
      const now = new Date(this.now());
      const ranges = [
        monthDataRange(now),
        monthDataRange(addMonths(now, 1))
      ];
      for (const range of ranges) {
        try {
          await this.refreshOneRange(range.startDate, range.endDate);
        } catch {
        }
      }
      return this.getCachedEvents(ranges[0].startDate, ranges[1].endDate).events;
    }
    async refreshEvents(startDate, endDate) {
      if (rangeLengthDays(startDate, endDate) > BROAD_PREFETCH_DAYS) {
        return this.prefetchCurrentAndNextMonth();
      }
      const range = normalizeCalendarReadRange(startDate, endDate);
      return this.refreshOneRange(range.startDate, range.endDate);
    }
    async refreshHistory() {
      const serverEntries = await this.source.listHistory(MAX_HISTORY2);
      serverEntries.forEach((entry) => {
        const mutationMatch = entry.mutationId && this.hiddenHistoryMutationIds.has(String(entry.mutationId));
        const semantic = historySemanticKey(entry);
        const semanticMatch = this.hiddenHistorySemanticKeys.has(semantic);
        if (!mutationMatch && !semanticMatch) return;
        if (entry.historyId) this.hiddenHistoryIds.add(String(entry.historyId));
        if (mutationMatch) this.hiddenHistoryMutationIds.delete(String(entry.mutationId));
        if (semanticMatch) this.hiddenHistorySemanticKeys.delete(semantic);
      });
      const localPending = this.history.filter((entry) => {
        if (!entry.localOnly) return false;
        if (entry.historyId && this.hiddenHistoryIds.has(String(entry.historyId))) return false;
        if (entry.mutationId && this.hiddenHistoryMutationIds.has(String(entry.mutationId))) return false;
        if (this.hiddenHistorySemanticKeys.has(historySemanticKey(entry))) return false;
        return true;
      });
      const seen = /* @__PURE__ */ new Set();
      this.history = [...serverEntries, ...localPending].filter((entry) => {
        if (entry.historyId && this.hiddenHistoryIds.has(String(entry.historyId))) return false;
        if (entry.mutationId && this.hiddenHistoryMutationIds.has(String(entry.mutationId))) return false;
        if (this.hiddenHistorySemanticKeys.has(historySemanticKey(entry))) return false;
        const key = entry.mutationId ? `mutation:${entry.mutationId}` : `semantic:${historySemanticKey(entry)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, MAX_HISTORY2);
      this.persist();
      this.persistHistoryDeletionState();
      this.emitChange();
      queueMicrotask(() => this.syncHistoryDeletes());
      return this.history;
    }
    deleteHistoryOptimistic(historyIds) {
      const ids = new Set((Array.isArray(historyIds) ? historyIds : [historyIds]).map(String).filter(Boolean));
      if (!ids.size) return [];
      const removed = this.history.filter((entry) => ids.has(String(entry.historyId || "")));
      removed.forEach((entry) => {
        const historyId = String(entry.historyId || "");
        if (!isLocalHistoryId(historyId)) {
          this.hiddenHistoryIds.add(historyId);
        } else if (entry.mutationId) {
          this.hiddenHistoryMutationIds.add(String(entry.mutationId));
        } else {
          this.hiddenHistorySemanticKeys.add(historySemanticKey(entry));
        }
      });
      this.history = this.history.filter((entry) => !ids.has(String(entry.historyId || "")));
      this.persist();
      this.persistHistoryDeletionState();
      this.emitChange();
      queueMicrotask(() => this.syncHistoryDeletes());
      return removed;
    }
    async syncHistoryDeletes() {
      if (this.historyDeleteSyncing || !this.hiddenHistoryIds.size) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      if (typeof this.source.deleteHistory !== "function") return;
      this.historyDeleteSyncing = true;
      const ids = [...this.hiddenHistoryIds];
      try {
        await this.source.deleteHistory(ids);
        ids.forEach((id) => this.hiddenHistoryIds.delete(id));
        this.persistHistoryDeletionState();
      } catch {
      } finally {
        this.historyDeleteSyncing = false;
      }
    }
    rollback(op, error) {
      const laterForSameTarget = this.outbox.slice(1).filter((item) => item.targetId === op.targetId);
      if (op.kind === "create" && laterForSameTarget.length) {
        const dependentIds = new Set(laterForSameTarget.map((item) => item.id));
        this.outbox = this.outbox.filter((item) => !dependentIds.has(item.id));
      }
      if (op.kind === "update" && laterForSameTarget.length) {
        this.outbox = this.outbox.filter((item) => item.id !== op.id);
        this.persist();
        this.emitChange();
        return;
      }
      super.rollback(op, error);
      this.emitChange();
    }
    async syncNow() {
      if (this.syncing) return;
      if (!this.outbox.length) {
        this.syncHistoryDeletes();
        return;
      }
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      this.syncing = true;
      clearTimeout(this.retryTimer);
      try {
        while (this.outbox.length) {
          const op = this.outbox[0];
          if (op.nextAttemptAt && op.nextAttemptAt > this.now()) {
            const delay = Math.max(50, op.nextAttemptAt - this.now());
            clearTimeout(this.retryTimer);
            this.retryTimer = setTimeout(() => this.syncNow(), delay);
            break;
          }
          try {
            await this.syncOperation(op);
            this.outbox.shift();
            this.persist();
            this.emitChange();
          } catch (error) {
            if (error?.retryable !== false) {
              this.scheduleRetry(op, error);
              break;
            }
            this.rollback(op, error);
          }
        }
      } finally {
        this.syncing = false;
      }
      this.syncHistoryDeletes();
      if (!this.outbox.length && (this.hiddenHistoryMutationIds.size || this.hiddenHistorySemanticKeys.size)) {
        this.refreshHistory().catch(() => {
        });
      }
    }
  };

  // src/services/history-v2-calendar-repository.js
  var MAX_HISTORY3 = 50;
  var DIRECT_SOURCE = "Google\u30AB\u30EC\u30F3\u30C0\u30FC\u76F4\u63A5\u64CD\u4F5C";
  function readStoredSet2(storage, key) {
    try {
      const value = JSON.parse(storage?.getItem(key) || "[]");
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch {
      return /* @__PURE__ */ new Set();
    }
  }
  function writeStoredSet2(storage, key, set) {
    try {
      storage?.setItem(key, JSON.stringify([...set]));
    } catch {
    }
  }
  function historyMinute(value) {
    const text = String(value || "");
    if (!text) return "";
    let timestamp = NaN;
    if (/Z$/.test(text)) {
      timestamp = Date.parse(text);
    } else {
      const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
      if (match) {
        timestamp = Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00+09:00`);
      }
    }
    return Number.isFinite(timestamp) ? String(Math.floor(timestamp / 6e4)) : text.slice(0, 16);
  }
  function historyLegacyOperationKey(entry) {
    return [
      entry?.action || "",
      entry?.customerName || "",
      entry?.startAt || "",
      entry?.endAt || "",
      historyMinute(entry?.timestamp)
    ].join("|");
  }
  function historySortValue(entry) {
    const minute = historyMinute(entry?.timestamp);
    return /^\d+$/.test(minute) ? Number(minute) : 0;
  }
  function isServerHistory(entry) {
    const id = String(entry?.historyId || "");
    return Boolean(id && !id.startsWith("local:") && !id.startsWith("local-legacy:"));
  }
  function mergeHistoryV2(serverEntries, localEntries, isHidden = () => false) {
    const combined = [
      ...Array.isArray(serverEntries) ? serverEntries : [],
      ...Array.isArray(localEntries) ? localEntries : []
    ];
    const seenMutations = /* @__PURE__ */ new Set();
    const seenHistoryIds = /* @__PURE__ */ new Set();
    const seenLegacy = /* @__PURE__ */ new Set();
    const output = [];
    combined.forEach((entry) => {
      if (!entry || isHidden(entry)) return;
      const mutationId = String(entry.mutationId || "");
      const historyId = String(entry.historyId || "");
      const legacyKey = historyLegacyOperationKey(entry);
      if (mutationId && seenMutations.has(mutationId)) return;
      if (historyId && seenHistoryIds.has(historyId)) return;
      if (legacyKey && seenLegacy.has(legacyKey)) return;
      if (mutationId) seenMutations.add(mutationId);
      if (historyId) seenHistoryIds.add(historyId);
      if (legacyKey) seenLegacy.add(legacyKey);
      output.push(entry);
    });
    return output.sort((a, b) => historySortValue(b) - historySortValue(a)).slice(0, MAX_HISTORY3);
  }
  var HistoryV2CalendarRepository = class extends ResponsiveLocalFirstCalendarRepository {
    constructor(source, options = {}) {
      super(source, options);
      this.historyPendingDeleteIdsKey = `${this.storageKey}:history-pending-delete-ids-v2`;
      this.historyHiddenLegacyKeysKey = `${this.storageKey}:history-hidden-legacy-ops-v2`;
      this.historyMigrationKey = `${this.storageKey}:history-migration-v2`;
      this.pendingHistoryDeleteIds = readStoredSet2(this.storage, this.historyPendingDeleteIdsKey);
      this.hiddenHistoryLegacyKeys = readStoredSet2(this.storage, this.historyHiddenLegacyKeysKey);
      this.hiddenHistoryIds.forEach((id) => this.pendingHistoryDeleteIds.add(id));
      this.migrateHistoryV2();
      this.persistHistoryV2State();
      queueMicrotask(() => this.syncHistoryDeletes());
    }
    persistHistoryV2State() {
      this.persistHistoryDeletionState();
      writeStoredSet2(this.storage, this.historyPendingDeleteIdsKey, this.pendingHistoryDeleteIds);
      writeStoredSet2(this.storage, this.historyHiddenLegacyKeysKey, this.hiddenHistoryLegacyKeys);
    }
    migrateHistoryV2() {
      if (this.storage?.getItem(this.historyMigrationKey) === "done") return;
      const serverLike = this.history.filter((entry) => isServerHistory(entry));
      const localLike = this.history.filter((entry) => !isServerHistory(entry));
      this.history = mergeHistoryV2(serverLike, localLike, (entry) => this.isHistoryHidden(entry));
      this.persist();
      try {
        this.storage?.setItem(this.historyMigrationKey, "done");
      } catch {
      }
    }
    isHistoryHidden(entry) {
      const historyId = String(entry?.historyId || "");
      const mutationId = String(entry?.mutationId || "");
      return Boolean(
        historyId && this.hiddenHistoryIds.has(historyId) || mutationId && this.hiddenHistoryMutationIds.has(mutationId) || this.hiddenHistorySemanticKeys.has(historySemanticKey(entry)) || this.hiddenHistoryLegacyKeys.has(historyLegacyOperationKey(entry))
      );
    }
    hideHistoryEntry(entry, { queueServerDelete = true } = {}) {
      if (!entry) return;
      const historyId = String(entry.historyId || "");
      const mutationId = String(entry.mutationId || "");
      const legacyKey = historyLegacyOperationKey(entry);
      if (historyId && isServerHistory(entry)) {
        this.hiddenHistoryIds.add(historyId);
        if (queueServerDelete) this.pendingHistoryDeleteIds.add(historyId);
      }
      if (mutationId) this.hiddenHistoryMutationIds.add(mutationId);
      if (legacyKey) this.hiddenHistoryLegacyKeys.add(legacyKey);
      this.hiddenHistorySemanticKeys.add(historySemanticKey(entry));
    }
    isLegacyRecurringAudit(entry) {
      if (entry?.source !== DIRECT_SOURCE || entry?.action !== "\u5909\u66F4") return false;
      const eventId = String(entry?.id || "");
      return Boolean(eventId && this.knownRecurringSeriesIds.has(eventId));
    }
    purgeKnownRecurringHistory() {
      let changed = false;
      this.history.forEach((entry) => {
        if (!this.isLegacyRecurringAudit(entry)) return;
        this.hideHistoryEntry(entry);
        changed = true;
      });
      if (!changed) return;
      this.history = this.history.filter((entry) => !this.isLegacyRecurringAudit(entry));
      this.persist();
      this.persistHistoryV2State();
      this.emitChange();
      queueMicrotask(() => this.syncHistoryDeletes());
    }
    async refreshOneRange(startDate, endDate) {
      const events = await super.refreshOneRange(startDate, endDate);
      let discovered = false;
      events.forEach((event) => {
        if (!event?.isRecurring) return;
        const seriesId = String(event.calendarEventId || event.id || "");
        if (!seriesId || this.knownRecurringSeriesIds.has(seriesId)) return;
        this.knownRecurringSeriesIds.add(seriesId);
        discovered = true;
      });
      if (discovered) this.purgeKnownRecurringHistory();
      return events;
    }
    async refreshHistory() {
      const serverEntries = await this.source.listHistory(MAX_HISTORY3);
      const visibleServer = [];
      serverEntries.forEach((entry) => {
        if (this.isLegacyRecurringAudit(entry) || this.isHistoryHidden(entry)) {
          this.hideHistoryEntry(entry);
          return;
        }
        visibleServer.push(entry);
      });
      const localPending = this.history.filter((entry) => entry.localOnly && !this.isHistoryHidden(entry));
      this.history = mergeHistoryV2(visibleServer, localPending, (entry) => this.isHistoryHidden(entry));
      this.persist();
      this.persistHistoryV2State();
      this.emitChange();
      queueMicrotask(() => this.syncHistoryDeletes());
      return this.history;
    }
    deleteHistoryOptimistic(historyIds) {
      const ids = new Set((Array.isArray(historyIds) ? historyIds : [historyIds]).map(String).filter(Boolean));
      if (!ids.size) return [];
      const removed = this.history.filter((entry) => ids.has(String(entry.historyId || "")));
      removed.forEach((entry) => this.hideHistoryEntry(entry));
      this.history = this.history.filter((entry) => !ids.has(String(entry.historyId || "")));
      this.persist();
      this.persistHistoryV2State();
      this.emitChange();
      queueMicrotask(() => this.syncHistoryDeletes());
      return removed;
    }
    promoteMutationHistory(mutationId, serverHistory) {
      const id = String(mutationId || "");
      if (!id) return;
      const localEntry = this.history.find((entry) => String(entry.mutationId || "") === id);
      if (this.hiddenHistoryMutationIds.has(id) || localEntry && this.isHistoryHidden(localEntry)) {
        if (serverHistory) this.hideHistoryEntry({ ...serverHistory, mutationId: serverHistory.mutationId || id });
        this.history = this.history.filter((entry) => String(entry.mutationId || "") !== id);
        this.persist();
        this.persistHistoryV2State();
        queueMicrotask(() => this.syncHistoryDeletes());
        return;
      }
      if (!serverHistory) return;
      const canonical = { ...serverHistory, mutationId: serverHistory.mutationId || id, localOnly: false };
      const legacyKey = historyLegacyOperationKey(canonical);
      this.history = this.history.filter((entry) => String(entry.mutationId || "") !== id && historyLegacyOperationKey(entry) !== legacyKey);
      this.history = mergeHistoryV2([canonical], this.history, (entry) => this.isHistoryHidden(entry));
      this.persist();
    }
    async syncHistoryDeletes() {
      if (this.historyDeleteSyncing || !this.pendingHistoryDeleteIds.size) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      if (typeof this.source.deleteHistory !== "function" && typeof this.source.deleteHistoryResult !== "function") return;
      this.historyDeleteSyncing = true;
      const ids = [...this.pendingHistoryDeleteIds].slice(0, MAX_HISTORY3);
      try {
        let acknowledged = [];
        if (typeof this.source.deleteHistoryResult === "function") {
          const result = await this.source.deleteHistoryResult(ids);
          acknowledged = result?.acknowledged || result?.deleted || [];
        } else {
          acknowledged = await this.source.deleteHistory(ids);
        }
        acknowledged.map(String).forEach((id) => this.pendingHistoryDeleteIds.delete(id));
        this.persistHistoryV2State();
      } catch {
      } finally {
        this.historyDeleteSyncing = false;
      }
    }
    async syncOperation(op) {
      if (op.kind === "create") {
        const result = typeof this.source.createEventWithHistory === "function" ? await this.source.createEventWithHistory(op.input, { mutationId: op.id }) : { event: await this.source.createEvent(op.input, { mutationId: op.id }), history: null };
        const serverEvent = result.event;
        const oldId = op.targetId;
        const later = this.outbox.slice(1).filter((item) => item.targetId === oldId);
        this.rewriteTargetId(oldId, serverEvent.id);
        const current = this.getEventCached(oldId);
        this.removeRecord(oldId);
        if (!later.some((item) => item.kind === "delete")) {
          this.upsertRecord(later.length && current ? { ...current, id: serverEvent.id, syncState: "pending", source: "local-first" } : { ...serverEvent, syncState: void 0 });
        }
        this.promoteMutationHistory(op.id, result.history);
        return;
      }
      if (op.kind === "update") {
        const result = typeof this.source.updateEventWithHistory === "function" ? await this.source.updateEventWithHistory(op.targetId, op.input, { mutationId: op.id }) : { event: await this.source.updateEvent(op.targetId, op.input, { mutationId: op.id }), history: null };
        const hasLater = this.outbox.slice(1).some((item) => item.targetId === op.targetId);
        if (!hasLater) this.upsertRecord({ ...result.event, syncState: void 0 });
        this.promoteMutationHistory(op.id, result.history);
        return;
      }
      if (op.kind === "delete") {
        const result = typeof this.source.deleteEventWithHistory === "function" ? await this.source.deleteEventWithHistory(op.targetId, { mutationId: op.id }) : (await this.source.deleteEvent(op.targetId, { mutationId: op.id }), { history: null });
        this.promoteMutationHistory(op.id, result.history);
      }
    }
  };

  // src/services/startup-priority-calendar-repository.js
  var BROAD_STARTUP_RANGE_DAYS = 90;
  var IDLE_TIMEOUT_MS = 1200;
  var FALLBACK_DELAY_MS = 350;
  var DAY_MS = 864e5;
  function rangeLengthDays2(startDate, endDate) {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.round((end - start) / DAY_MS);
  }
  function scheduleStartupBackgroundTask(callback, {
    windowRef = globalThis.window,
    timeout = IDLE_TIMEOUT_MS,
    fallbackDelay = FALLBACK_DELAY_MS
  } = {}) {
    if (typeof windowRef?.requestIdleCallback === "function") {
      const id = windowRef.requestIdleCallback(callback, { timeout });
      return () => windowRef.cancelIdleCallback?.(id);
    }
    const timer = globalThis.setTimeout(callback, fallbackDelay);
    return () => globalThis.clearTimeout(timer);
  }
  function withStartupPriority(repository2, { windowRef = globalThis.window } = {}) {
    let initialHistoryDeferred = false;
    let cancelDeferredHistory = null;
    let broadRefreshScheduled = false;
    const schedule = (callback, options = {}) => scheduleStartupBackgroundTask(callback, { windowRef, ...options });
    return new Proxy(repository2, {
      get(target, property, receiver) {
        if (property === "refreshEvents") {
          return (startDate, endDate) => {
            const broadStartupRead = rangeLengthDays2(startDate, endDate) > BROAD_STARTUP_RANGE_DAYS;
            if (!broadStartupRead) return target.refreshEvents(startDate, endDate);
            if (!broadRefreshScheduled) {
              broadRefreshScheduled = true;
              schedule(() => {
                broadRefreshScheduled = false;
                target.refreshEvents(startDate, endDate).catch(() => {
                });
              }, { timeout: 900, fallbackDelay: 250 });
            }
            return Promise.resolve(target.getCachedEvents(startDate, endDate)?.events || []);
          };
        }
        if (property === "refreshHistory") {
          return (...args) => {
            const historyIsVisible = /^#\/history(?:$|[/?])/.test(String(windowRef?.location?.hash || ""));
            if (!initialHistoryDeferred && !historyIsVisible) {
              initialHistoryDeferred = true;
              cancelDeferredHistory = schedule(() => {
                cancelDeferredHistory = null;
                target.refreshHistory(...args).catch(() => {
                });
              }, { timeout: 1600, fallbackDelay: 700 });
              return Promise.resolve(target.getCachedHistory?.() || []);
            }
            if (cancelDeferredHistory) {
              cancelDeferredHistory();
              cancelDeferredHistory = null;
            }
            return target.refreshHistory(...args);
          };
        }
        const value = Reflect.get(target, property, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  }

  // src/services/repository-factory.js
  function createCalendarRepository() {
    if (window.location.protocol === "file:" && !window.TAMAFIT_USE_LIVE_CALENDAR) {
      return new CachedCalendarRepository(new LocalCalendarRepository(), {
        storageKey: "tamafit_staff_calendar_mock_cache_v1"
      });
    }
    return withStartupPriority(new HistoryV2CalendarRepository(new GoogleCalendarRepository(), {
      storageKey: "tamafit_staff_calendar_local_first_v1"
    }));
  }

  // src/utils/html.js
  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  // src/views/app-shell.js
  function renderAppShell(content, {
    title = APP_NAME,
    subtitle = "\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",
    backAction = "",
    showAdd = true,
    isRefreshing = false
  } = {}) {
    const operator = getOperatorProfile();
    return `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__inner">
          ${backAction ? `
            <button class="icon-button" type="button" data-action="${backAction}" aria-label="\u524D\u306E\u753B\u9762\u3078\u623B\u308B">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="app-header__copy">
              <span>${subtitle}</span>
              <strong>${title}</strong>
            </div>
          ` : `
            <button class="header-home" type="button" data-action="go-home" aria-label="\u30DB\u30FC\u30E0\u306B\u623B\u308B">
              <span class="brand-mark" aria-hidden="true">T</span>
              <span class="app-header__copy">
                <span>${subtitle}</span>
                <strong>${title}</strong>
              </span>
            </button>
          `}
          ${isRefreshing ? `<span class="refresh-status" role="status"><i aria-hidden="true"></i>\u66F4\u65B0\u4E2D</span>` : ""}
          ${showAdd ? `
            <button class="header-add-button" type="button" data-action="new-booking" aria-label="\u4E88\u7D04\u3092\u8FFD\u52A0">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          ` : `<span class="app-header__spacer" aria-hidden="true"></span>`}
        </div>
      </header>
      <main class="app-main">${content}</main>
      <footer class="app-footer">
        <button class="operator-setting" type="button" data-action="change-operator">
          <span>\u3053\u306E\u7AEF\u672B\u306E\u64CD\u4F5C\u8005</span>
          <strong>${operator?.name || "\u672A\u8A2D\u5B9A"}</strong>
          <small>\u5909\u66F4</small>
        </button>
      </footer>
    </div>
  `;
  }
  function renderLoading() {
    return `
    <div class="app-shell">
      <div class="loading-screen" role="status">
        <div class="loading-mark">T</div>
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>\u4E88\u7D04\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059</p>
      </div>
    </div>
  `;
  }
  function renderError(message) {
    return renderAppShell(`
    <section class="state-panel">
      <span class="state-panel__icon" aria-hidden="true">!</span>
      <h2>\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F</h2>
      <p>${message}</p>
      <button class="button button--primary" type="button" data-action="reload">\u3082\u3046\u4E00\u5EA6\u8A66\u3059</button>
    </section>
  `);
  }

  // src/views/booking-form-view.js
  function renderBookingForm({ event = null, defaultDate, defaultTrainerId = "tamai" }) {
    const isEditing = Boolean(event);
    const startParts = event ? dateTimeToParts(event.startAt) : { date: defaultDate, time: "10:00" };
    const type = event?.type || "member";
    const selectedTrainerId = event ? event.trainerId : defaultTrainerId;
    const times = createTimeOptions(OPENING_TIME, CLOSING_TIME, TIME_STEP_MINUTES);
    const content = `
    <section class="booking-form-view">
      <div class="form-heading">
        <p class="eyebrow">${isEditing ? "\u4E88\u7D04\u5185\u5BB9\u306E\u5909\u66F4" : "\u65B0\u3057\u3044\u4E88\u7D04"}</p>
        <h1>${isEditing ? "\u4E88\u7D04\u3092\u7DE8\u96C6" : "\u4E88\u7D04\u3092\u8FFD\u52A0"}</h1>
        <p>\u4FDD\u5B58\u3059\u308B\u3068\u3059\u3050\u753B\u9762\u306B\u53CD\u6620\u3055\u308C\u3001Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u540C\u671F\u306F\u88CF\u5074\u3067\u884C\u308F\u308C\u307E\u3059\u3002</p>
      </div>

      <form class="booking-form" id="bookingForm" data-event-id="${escapeAttribute(event?.id || "")}">
        <div class="field field--full">
          <label for="customerName">\u304A\u5BA2\u69D8\u540D\u30FB\u4E88\u5B9A\u540D</label>
          <input id="customerName" name="customerName" type="text" value="${escapeAttribute(event?.customerName || "")}" placeholder="\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50" autocomplete="off" required>
          <small>\u4E88\u7D04\u30D6\u30ED\u30C3\u30AF\u30FB\u4EEE\u4E88\u7D04\u67A0\u30FB\u30A4\u30D9\u30F3\u30C8\u3067\u306F\u3001\u7528\u9014\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002</small>
        </div>

        <div class="field field--full">
          <label for="trainerId">\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC</label>
          <div class="select-wrap">
            <select id="trainerId" name="trainerId">
              <option value="" ${selectedTrainerId === "" ? "selected" : ""}>\u6307\u5B9A\u306A\u3057\uFF08\u5171\u901A\u4E88\u5B9A\uFF09</option>
              ${TRAINERS.map((trainer) => `<option value="${trainer.id}" ${selectedTrainerId === trainer.id ? "selected" : ""}>${escapeHtml(trainer.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingDate">\u4E88\u7D04\u65E5</label>
          <input id="bookingDate" name="date" type="date" value="${escapeAttribute(startParts.date)}" required>
        </div>

        <div class="field">
          <label for="bookingTime">\u958B\u59CB\u6642\u9593</label>
          <div class="select-wrap">
            <select id="bookingTime" name="time" required>
              ${times.map((time) => `<option value="${time}" ${startParts.time === time ? "selected" : ""}>${time}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="duration">\u6240\u8981\u6642\u9593</label>
          <div class="select-wrap">
            <select id="duration" name="duration" required>
              ${DURATIONS.map((duration) => `<option value="${duration}" ${(event?.duration || 60) === duration ? "selected" : ""}>${duration}\u5206</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingType">\u4E88\u7D04\u7A2E\u985E</label>
          <div class="select-wrap">
            <select id="bookingType" name="type" required>
              ${BOOKING_TYPES.map((item) => `<option value="${item.id}" ${type === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field field--full">
          <label for="notes">\u30E1\u30E2 <span>\u4EFB\u610F</span></label>
          <textarea id="notes" name="notes" rows="3" placeholder="\u5F53\u65E5\u306E\u6CE8\u610F\u70B9\u3084\u7533\u3057\u9001\u308A">${escapeHtml(event?.notes || "")}</textarea>
        </div>

        <div class="form-message" id="formMessage" role="alert"></div>

        <div class="form-actions">
          ${isEditing ? `<button class="button button--danger" type="button" data-action="delete-booking" data-id="${escapeAttribute(event.id)}">\u4E88\u7D04\u3092\u524A\u9664</button>` : ""}
          <button class="button button--primary ${isEditing ? "" : "button--wide"}" type="submit">${isEditing ? "\u5909\u66F4\u3092\u4FDD\u5B58" : "\u4E88\u7D04\u3059\u308B"}</button>
        </div>
      </form>
    </section>
  `;
    return renderAppShell(content, {
      title: isEditing ? "\u4E88\u7D04\u3092\u7DE8\u96C6" : "\u4E88\u7D04\u3092\u8FFD\u52A0",
      subtitle: "\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",
      backAction: "back-from-form",
      showAdd: false
    });
  }

  // src/views/day-view.js
  function renderDayEvent(event) {
    const trainer = TRAINERS.find((item) => item.id === event.trainerId);
    const type = getBookingType(event.type);
    const isCustomerReservation = ["member", "trial", "consultation"].includes(event.type);
    const color = event.type === "trial" ? "amber" : trainer?.color || "neutral";
    const isRecurring = Boolean(event.isRecurring);
    const actionAttributes = isRecurring ? 'aria-disabled="true" title="\u7E70\u308A\u8FD4\u3057\u4E88\u5B9A\u306FGoogle\u30AB\u30EC\u30F3\u30C0\u30FC\u304B\u3089\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044"' : `data-action="edit-booking" data-id="${event.id}"`;
    return `
    <button class="day-event day-event--${color}${isRecurring ? " is-readonly" : ""}" type="button" ${actionAttributes}>
      <span class="day-event__time">
        <strong>${event.startAt.slice(11, 16)}</strong>
        <small>${event.endAt.slice(11, 16)}</small>
      </span>
      <span class="day-event__line" aria-hidden="true"></span>
      <span class="day-event__content">
        <span class="day-event__badges">
          <small>${escapeHtml(trainer?.name || "\u6307\u5B9A\u306A\u3057")}</small>
          <small>${escapeHtml(type.name)}</small>
          ${isRecurring ? "<small>\u5B9A\u671F</small>" : ""}
        </span>
        <strong>${escapeHtml(isCustomerReservation ? `${event.customerName} \u69D8` : event.customerName)}</strong>
        <span>${event.duration}\u5206${event.notes ? `\u30FB${escapeHtml(event.notes)}` : ""}</span>
      </span>
      ${isRecurring ? '<span class="sync-badge" aria-label="Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306E\u7E70\u308A\u8FD4\u3057\u4E88\u5B9A">\u5B9A\u671F</span>' : `<span class="day-event__manage" aria-label="\u30BF\u30C3\u30D7\u3057\u3066\u5909\u66F4\u307E\u305F\u306F\u524A\u9664">
            <span class="day-event__manage-edit">\u5909\u66F4</span>
            <span class="day-event__manage-separator">\u30FB</span>
            <span class="day-event__manage-delete">\u524A\u9664</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </span>`}
    </button>
  `;
  }
  function renderDayView(date, events) {
    const isoDate = toISODate(date);
    const content = `
    <section class="day-view">
      <div class="day-summary">
        <div>
          <p class="eyebrow">1\u65E5\u306E\u4E88\u7D04</p>
          <h1>${formatDayTitle(date)}</h1>
        </div>
        <span class="count-badge">${events.length}\u4EF6</span>
      </div>

      <div class="day-event-list">
        ${events.length ? events.map(renderDayEvent).join("") : `
          <div class="empty-day">
            <span aria-hidden="true">\u2713</span>
            <h2>\u4E88\u7D04\u306F\u3042\u308A\u307E\u305B\u3093</h2>
            <p>\u3053\u306E\u65E5\u306F\u307E\u3060\u3059\u3079\u3066\u306E\u6642\u9593\u3092\u8ABF\u6574\u3067\u304D\u307E\u3059\u3002</p>
          </div>
        `}
      </div>

      <button class="button button--wide day-add-button day-standard-booking-button" type="button" data-action="new-booking" data-date="${isoDate}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        \u3053\u306E\u65E5\u306B\u4E88\u7D04\u3092\u8FFD\u52A0
      </button>
      <button class="button button--wide day-quick-booking-button" type="button" data-quick-booking data-date="${isoDate}">
        <span class="day-quick-booking-button__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M13 2 5 14h7l-1 8 8-12h-7l1-8Z"/></svg>
        </span>
        <span class="day-quick-booking-button__copy">
          <strong>\u30AF\u30A4\u30C3\u30AF\u4E88\u7D04</strong>
          <small>\u65E5\u4ED8\u3068\u6642\u9593\u3060\u3051\u3067\u767B\u9332</small>
        </span>
        <svg class="day-quick-booking-button__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </section>
  `;
    return renderAppShell(content, {
      title: "\u4E88\u7D04\u4E00\u89A7",
      subtitle: formatDayTitle(date),
      backAction: "back-to-calendar",
      showAdd: false
    });
  }

  // src/history-ui.js
  var HISTORY_PREVIEW_LIMIT = 10;
  function historyActionLabel(action) {
    return {
      "\u4F5C\u6210": "\u65B0\u898F\u4E88\u7D04",
      "\u5909\u66F4": "\u5185\u5BB9\u5909\u66F4",
      "\u524A\u9664": "\u4E88\u7D04\u524A\u9664"
    }[action] || String(action || "\u64CD\u4F5C");
  }
  function historyActionClass(action) {
    return { "\u4F5C\u6210": "create", "\u5909\u66F4": "update", "\u524A\u9664": "delete" }[action] || "other";
  }
  function datePartsFromLocalTimestamp(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (!match) return null;
    return {
      month: Number(match[2]),
      day: Number(match[3]),
      hour: match[4],
      minute: match[5]
    };
  }
  function formatHistoryTimestamp(value) {
    const text = String(value || "");
    if (!text) return "\u65E5\u6642\u4E0D\u660E";
    if (/Z$/.test(text)) {
      const date = new Date(text);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("ja-JP", {
          timeZone: "Asia/Tokyo",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(date);
      }
    }
    const parts = datePartsFromLocalTimestamp(text);
    if (!parts) return text.slice(0, 16);
    return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
  }
  function formatHistoryClock(value) {
    const formatted = formatHistoryTimestamp(value);
    const match = formatted.match(/(\d{1,2}:\d{2})$/);
    return match ? match[1] : formatted;
  }
  function renderRecentHistory(entries, limit = HISTORY_PREVIEW_LIMIT) {
    const recent = (Array.isArray(entries) ? entries : []).slice(0, limit);
    const rows = recent.length ? recent.map((entry) => `
        <div class="recent-history__row">
          <time>${escapeHtml(formatHistoryClock(entry.timestamp))}</time>
          <strong title="${escapeAttribute(entry.customerName || "\u540D\u79F0\u306A\u3057")}">${escapeHtml(entry.customerName || "\u540D\u79F0\u306A\u3057")}</strong>
          <span>${escapeHtml(historyActionLabel(entry.action))}</span>
        </div>
      `).join("") : `<p class="recent-history__empty">\u64CD\u4F5C\u5C65\u6B74\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093</p>`;
    return `
    <section class="recent-history" aria-label="\u6700\u8FD1\u306E\u64CD\u4F5C\u30ED\u30B0">
      <div class="recent-history__heading">
        <strong>\u6700\u8FD1\u306E\u64CD\u4F5C\u30ED\u30B0</strong>
        <span>${HISTORY_PREVIEW_LIMIT}\u4EF6</span>
      </div>
      <div class="recent-history__list">${rows}</div>
      <button class="recent-history__more" type="button" data-action="open-history">
        \u5C65\u6B74\u3092\u3059\u3079\u3066\u898B\u308B
        <span aria-hidden="true">\u203A</span>
      </button>
    </section>
  `;
  }

  // src/views/history-view.js
  function bookingRange(entry) {
    const start = String(entry.startAt || "").replace("T", " ").slice(0, 16);
    const end = String(entry.endAt || "").slice(11, 16);
    return `${start}\u301C${end}`;
  }
  function renderOrganizeEntry(entry) {
    const historyId = String(entry.historyId || "");
    const manageable = Boolean(historyId);
    return `
    <article class="history-entry history-entry--${historyActionClass(entry.action)} is-organizing-row" data-history-entry="${escapeAttribute(historyId)}">
      <label class="history-entry__organize-row">
        ${manageable ? `
          <span class="history-entry__select" aria-label="\u3053\u306E\u5C65\u6B74\u3092\u9078\u629E">
            <input type="checkbox" data-history-select value="${escapeAttribute(historyId)}">
            <span aria-hidden="true"></span>
          </span>
        ` : '<span class="history-entry__select-placeholder" aria-hidden="true"></span>'}
        <time>${escapeHtml(formatHistoryTimestamp(entry.timestamp))}</time>
        <strong title="${escapeAttribute(entry.customerName || "\u540D\u79F0\u306A\u3057")}">${escapeHtml(entry.customerName || "\u540D\u79F0\u306A\u3057")}</strong>
        <span>${escapeHtml(historyActionLabel(entry.action))}</span>
      </label>
    </article>
  `;
  }
  function renderEntry(entry, { organizing = false } = {}) {
    if (organizing) return renderOrganizeEntry(entry);
    const historyId = String(entry.historyId || "");
    const manageable = Boolean(historyId);
    return `
    <details class="history-entry history-entry--${historyActionClass(entry.action)}" data-history-entry="${escapeAttribute(historyId)}">
      <summary class="history-entry__summary">
        <time>${escapeHtml(formatHistoryTimestamp(entry.timestamp))}</time>
        <strong title="${escapeAttribute(entry.customerName || "\u540D\u79F0\u306A\u3057")}">${escapeHtml(entry.customerName || "\u540D\u79F0\u306A\u3057")}</strong>
        <span>${escapeHtml(historyActionLabel(entry.action))}</span>
        <i aria-hidden="true">\u203A</i>
      </summary>
      <div class="history-entry__details">
        <div class="history-entry__details-line">
          <span>\u4E88\u7D04</span>
          <strong>${escapeHtml(bookingRange(entry))}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u64CD\u4F5C</span>
          <strong>${escapeHtml(entry.source || "\u4E0D\u660E")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u62C5\u5F53</span>
          <strong>${escapeHtml(entry.trainerName || "\u6307\u5B9A\u306A\u3057")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>\u7A2E\u985E</span>
          <strong>${escapeHtml(entry.typeName || "\u4E88\u5B9A")}</strong>
        </div>
        ${entry.beforeSummary ? `
          <div class="history-entry__details-line history-entry__before">
            <span>\u5909\u66F4\u524D</span>
            <strong>${escapeHtml(entry.beforeSummary)}</strong>
          </div>
        ` : ""}
        ${manageable ? `
          <button class="history-entry__delete" type="button" data-action="delete-history-one" data-history-id="${escapeAttribute(historyId)}">\u3053\u306E\u8A18\u9332\u3092\u524A\u9664</button>
        ` : ""}
      </div>
    </details>
  `;
  }
  function renderHistoryView(entries, { organizing = false } = {}) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const content = `
    <section class="history-view ${organizing ? "is-organizing" : ""}">
      <div class="history-heading">
        <div class="history-heading__copy">
          <p class="eyebrow">\u4E88\u7D04\u64CD\u4F5C\u306E\u8A18\u9332</p>
          <h1>\u64CD\u4F5C\u5C65\u6B74</h1>
          <p>\u6700\u65B050\u4EF6\u3092\u65B0\u3057\u3044\u9806\u306B\u8868\u793A\u3057\u307E\u3059\u3002\u5C65\u6B74\u3092\u6D88\u3057\u3066\u3082\u4E88\u7D04\u81EA\u4F53\u306B\u306F\u5F71\u97FF\u3057\u307E\u305B\u3093\u3002</p>
        </div>
        ${safeEntries.length ? `
          <button class="history-organize-button" type="button" data-action="${organizing ? "history-organize-cancel" : "history-organize"}">
            ${organizing ? "\u5B8C\u4E86" : "\u5C65\u6B74\u3092\u6574\u7406"}
          </button>
        ` : ""}
      </div>
      <div class="history-list">
        ${safeEntries.length ? safeEntries.map((entry) => renderEntry(entry, { organizing })).join("") : `
          <div class="empty-day">
            <span aria-hidden="true">i</span>
            <h2>\u64CD\u4F5C\u5C65\u6B74\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093</h2>
            <p>\u4E88\u7D04\u3092\u8FFD\u52A0\u30FB\u5909\u66F4\u30FB\u524A\u9664\u3059\u308B\u3068\u3001\u3053\u3053\u306B\u8A18\u9332\u3055\u308C\u307E\u3059\u3002</p>
          </div>
        `}
      </div>
      ${organizing && safeEntries.length ? `
        <div class="history-selection-bar">
          <span><strong data-history-selected-count>0</strong>\u4EF6\u3092\u9078\u629E</span>
          <button type="button" data-action="delete-history-selected" disabled>\u9078\u629E\u3057\u305F\u5C65\u6B74\u3092\u524A\u9664</button>
        </div>
      ` : ""}
    </section>
  `;
    return renderAppShell(content, {
      title: "\u64CD\u4F5C\u5C65\u6B74",
      subtitle: "\u30B9\u30BF\u30C3\u30D5\u30AB\u30EC\u30F3\u30C0\u30FC",
      backAction: "back-to-calendar",
      showAdd: false
    });
  }

  // src/views/month-view.js
  function groupEvents(events) {
    return events.reduce((groups, event) => {
      const date = event.startAt.slice(0, 10);
      groups[date] ||= [];
      groups[date].push(event);
      return groups;
    }, {});
  }
  function renderEventChip(event) {
    const trainer = TRAINERS.find((item) => item.id === event.trainerId);
    const time = event.startAt.slice(11, 16);
    const displayName = Array.from(event.customerName.split(/[ 　]/)[0]).slice(0, 2).join("");
    const color = event.type === "trial" ? "amber" : trainer?.color || "neutral";
    return `
    <span class="month-event month-event--${color}" title="${escapeAttribute(`${time} ${event.customerName}`)}">
      <b>${escapeHtml(time)}</b><span>${escapeHtml(displayName)}</span>
    </span>
  `;
  }
  function renderMonthView(anchorDate, events, history2 = []) {
    const days = getMonthGrid(anchorDate);
    const eventsByDate = groupEvents(events);
    const currentMonth = anchorDate.getMonth();
    const calendarCells = days.map((date) => {
      const isoDate = toISODate(date);
      const dayEvents = eventsByDate[isoDate] || [];
      const visibleEvents = dayEvents.slice(0, MONTH_EVENT_LIMIT);
      const remaining = dayEvents.length - visibleEvents.length;
      const classes = ["month-cell"];
      if (date.getMonth() !== currentMonth) classes.push("is-outside");
      if (isToday(date)) classes.push("is-today");
      if (date.getDay() === 0) classes.push("is-sunday");
      if (date.getDay() === 6) classes.push("is-saturday");
      return `
      <button class="${classes.join(" ")}" type="button" data-action="open-day" data-date="${isoDate}" aria-label="${date.getMonth() + 1}\u6708${date.getDate()}\u65E5\u3001\u4E88\u7D04${dayEvents.length}\u4EF6">
        <span class="month-cell__date">${date.getDate()}</span>
        <span class="month-cell__events">
          ${visibleEvents.map(renderEventChip).join("")}
          ${remaining > 0 ? `<span class="month-event-more">\u307B\u304B${remaining}\u4EF6</span>` : ""}
        </span>
      </button>
    `;
    }).join("");
    const content = `
    <section class="calendar-view" aria-labelledby="calendarTitle">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-month" aria-label="\u524D\u306E\u6708">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 id="calendarTitle">${formatMonthTitle(anchorDate)}</h1>
          <button class="icon-button icon-button--subtle" type="button" data-action="next-month" aria-label="\u6B21\u306E\u6708">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button class="today-button" type="button" data-action="today">\u4ECA\u6708\u3078\u623B\u308B</button>
      </div>

      <div class="view-switch" aria-label="\u30AB\u30EC\u30F3\u30C0\u30FC\u8868\u793A">
        <button class="is-active" type="button" data-action="show-month" aria-pressed="true">\u6708\u9593</button>
        <button type="button" data-action="show-week" aria-pressed="false">\u9031\u9593</button>
      </div>

      <div class="month-calendar" data-month="${monthRouteValue(anchorDate)}">
        <div class="weekday-row" aria-hidden="true">
          ${WEEKDAYS_SHORT.map((day, index) => `<span class="${index === 0 ? "is-sunday" : index === 6 ? "is-saturday" : ""}">${day}</span>`).join("")}
        </div>
        <div class="month-grid">${calendarCells}</div>
      </div>

      ${renderRecentHistory(history2)}

      <div class="calendar-legend" aria-label="\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC\u306E\u8272\u5206\u3051">
        ${TRAINERS.map((trainer) => `<span><i class="legend-dot legend-dot--${trainer.color}"></i>${escapeHtml(trainer.name)}</span>`).join("")}
        <span><i class="legend-dot legend-dot--amber"></i>\u4F53\u9A13</span>
      </div>
    </section>
  `;
    return renderAppShell(content);
  }

  // src/views/week-view.js
  function groupEvents2(events) {
    return events.reduce((groups, event) => {
      const date = event.startAt.slice(0, 10);
      groups[date] ||= [];
      groups[date].push(event);
      return groups;
    }, {});
  }
  function renderWeekEvent(event) {
    const trainer = TRAINERS.find((item) => item.id === event.trainerId);
    const color = event.type === "trial" ? "amber" : trainer?.color || "neutral";
    return `
    <div class="week-event week-event--${color}">
      <time>${event.startAt.slice(11, 16)}</time>
      <span class="week-event__main">
        <strong>${escapeHtml(event.customerName)}</strong>
        <small>${escapeHtml(trainer?.name || "\u6307\u5B9A\u306A\u3057")}\u30FB${event.duration}\u5206</small>
      </span>
    </div>
  `;
  }
  function renderWeekView(anchorDate, events, history2 = []) {
    const days = getWeekDays(anchorDate);
    const grouped = groupEvents2(events);
    const dayRows = days.map((date) => {
      const isoDate = toISODate(date);
      const dayEvents = grouped[isoDate] || [];
      return `
      <article class="week-day ${isToday(date) ? "is-today" : ""}">
        <button class="week-day__header" type="button" data-action="open-day" data-date="${isoDate}">
          <span>${formatShortDay(date)}</span>
          <small>${dayEvents.length ? `${dayEvents.length}\u4EF6` : "\u4E88\u7D04\u306A\u3057"}</small>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <div class="week-day__events">
          ${dayEvents.length ? dayEvents.map(renderWeekEvent).join("") : `<p class="week-day__empty">\u4E88\u7D04\u306F\u3042\u308A\u307E\u305B\u3093</p>`}
        </div>
      </article>
    `;
    }).join("");
    const content = `
    <section class="calendar-view">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-week" aria-label="\u524D\u306E\u9031">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1>${formatWeekRange(anchorDate)}</h1>
          <button class="icon-button icon-button--subtle" type="button" data-action="next-week" aria-label="\u6B21\u306E\u9031">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button class="today-button" type="button" data-action="go-home">\u4ECA\u6708\u3078\u623B\u308B</button>
      </div>

      <div class="view-switch" aria-label="\u30AB\u30EC\u30F3\u30C0\u30FC\u8868\u793A">
        <button type="button" data-action="show-month" aria-pressed="false">\u6708\u9593</button>
        <button class="is-active" type="button" data-action="show-week" aria-pressed="true">\u9031\u9593</button>
      </div>

      <div class="week-list">${dayRows}</div>
      ${renderRecentHistory(history2)}
    </section>
  `;
    return renderAppShell(content);
  }

  // src/app.js
  var app = document.getElementById("app");
  var repository = createCalendarRepository();
  var confirmDialog = document.getElementById("confirmDialog");
  var toast = document.getElementById("toast");
  var pwaInstallDialog = document.getElementById("pwaInstallDialog");
  var lastCalendarHash = "";
  var pendingRender = 0;
  var toastTimer = null;
  function ensureOperatorDialog() {
    let dialog = document.getElementById("operatorDialog");
    if (dialog) return dialog;
    document.body.insertAdjacentHTML("beforeend", `
    <dialog class="operator-dialog" id="operatorDialog">
      <div class="operator-dialog__body">
        <p class="eyebrow">\u3053\u306E\u7AEF\u672B\u3092\u8A2D\u5B9A</p>
        <h2>\u64CD\u4F5C\u8005\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044</h2>
        <p>\u4E88\u7D04\u306E\u62C5\u5F53\u521D\u671F\u5024\u3068\u64CD\u4F5C\u5C65\u6B74\u306B\u4F7F\u7528\u3057\u307E\u3059\u3002</p>
        <div class="operator-dialog__choices">
          ${OPERATORS.map((operator) => `
            <button type="button" data-operator-choice="${operator.id}">
              <strong>${operator.name}</strong>
              <span>${operator.trainerId ? `\u65B0\u898F\u4E88\u7D04\u306E\u62C5\u5F53\uFF1A${operator.name}` : "\u65B0\u898F\u4E88\u7D04\u306E\u62C5\u5F53\uFF1A\u6307\u5B9A\u306A\u3057"}</span>
            </button>
          `).join("")}
        </div>
        <button class="operator-dialog__cancel" type="button" data-operator-cancel>\u5909\u66F4\u3057\u306A\u3044</button>
      </div>
    </dialog>
  `);
    return document.getElementById("operatorDialog");
  }
  function chooseOperator({ required = false } = {}) {
    const dialog = ensureOperatorDialog();
    const cancelButton = dialog.querySelector("[data-operator-cancel]");
    cancelButton.hidden = required;
    return new Promise((resolve) => {
      const finish = (operatorId = "") => {
        dialog.removeEventListener("click", onClick);
        dialog.removeEventListener("cancel", onCancel);
        if (operatorId) saveOperatorId(operatorId);
        if (dialog.open) dialog.close();
        resolve(operatorId ? getOperatorProfile() : null);
      };
      const onClick = (event) => {
        const choice = event.target.closest("[data-operator-choice]");
        if (choice) finish(choice.dataset.operatorChoice);
        if (event.target.closest("[data-operator-cancel]")) finish();
      };
      const onCancel = (event) => {
        event.preventDefault();
        if (!required) finish();
      };
      dialog.addEventListener("click", onClick);
      dialog.addEventListener("cancel", onCancel);
      dialog.showModal();
    });
  }
  function calendarRouteConfig(route) {
    if (route.name === "month") {
      const anchor = parseMonthRoute(route.month);
      const days = getMonthGrid(anchor);
      return {
        startDate: toISODate(days[0]),
        endDate: toISODate(days.at(-1)),
        render: (events, isRefreshing) => renderMonthView(anchor, events, { isRefreshing }),
        hash: window.location.hash,
        view: "month"
      };
    }
    if (route.name === "week") {
      const anchor = currentDateForRoute(route);
      const days = getWeekDays(anchor);
      return {
        startDate: toISODate(days[0]),
        endDate: toISODate(days.at(-1)),
        render: (events, isRefreshing) => renderWeekView(anchor, events, { isRefreshing }),
        hash: window.location.hash,
        view: "week"
      };
    }
    if (route.name === "day") {
      const date = currentDateForRoute(route);
      const isoDate = toISODate(date);
      return {
        startDate: isoDate,
        endDate: isoDate,
        render: (events, isRefreshing) => renderDayView(date, events, { isRefreshing }),
        hash: "",
        view: ""
      };
    }
    return null;
  }
  function setRouteLoading(isLoading) {
    app.classList.toggle("is-refreshing", isLoading);
    app.setAttribute("aria-busy", String(isLoading));
  }
  function displayCalendar(config, events, { isRefreshing = false, resetScroll = true } = {}) {
    app.innerHTML = config.render(events, isRefreshing);
    syncInstallBanner();
    setRouteLoading(false);
    if (config.hash) lastCalendarHash = config.hash;
    if (config.view) saveLastView(config.view);
    if (resetScroll) window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function renderCalendarRoute(config, renderId, forceRefresh) {
    const cached = repository.getCachedEvents?.(config.startDate, config.endDate);
    const shouldRefresh = forceRefresh || !cached || !cached.isFresh;
    if (cached) {
      displayCalendar(config, cached.events, { isRefreshing: shouldRefresh });
      if (!shouldRefresh) return;
      repository.refreshEvents(config.startDate, config.endDate).then((events2) => {
        if (renderId !== pendingRender) return;
        displayCalendar(config, events2, { resetScroll: false });
      }).catch((error) => {
        if (renderId !== pendingRender) return;
        setRouteLoading(false);
        showToast(error.message || "\u6700\u65B0\u306E\u4E88\u7D04\u72B6\u6CC1\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
      });
      return;
    }
    if (app.querySelector(".calendar-view, .day-view")) {
      setRouteLoading(true);
    } else {
      app.innerHTML = renderLoading();
    }
    const events = forceRefresh ? await repository.refreshEvents(config.startDate, config.endDate) : await repository.listEvents(config.startDate, config.endDate);
    if (renderId === pendingRender) displayCalendar(config, events);
  }
  function currentDateForRoute(route) {
    if (route.name === "month") return parseMonthRoute(route.month);
    if ((route.name === "week" || route.name === "day" || route.name === "booking-new") && isValidISODate(route.date)) {
      return parseISODate(route.date);
    }
    return /* @__PURE__ */ new Date();
  }
  function rememberReturnLocation() {
    if (["month", "week", "day"].includes(parseRoute().name)) {
      sessionStorage.setItem("tamafit_calendar_return_hash", window.location.hash);
    }
  }
  function getReturnLocation(fallbackDate = /* @__PURE__ */ new Date()) {
    return sessionStorage.getItem("tamafit_calendar_return_hash") || lastCalendarHash || `#/month/${monthRouteValue(fallbackDate)}`;
  }
  function showToast(message, { duration = 2800, actionLabel = "", onAction = null } = {}) {
    clearTimeout(toastTimer);
    toast.replaceChildren();
    const text = document.createElement("span");
    text.textContent = message;
    toast.append(text);
    if (actionLabel && onAction) {
      const actionButton = document.createElement("button");
      actionButton.className = "toast__action";
      actionButton.type = "button";
      actionButton.textContent = actionLabel;
      actionButton.addEventListener("click", async () => {
        clearTimeout(toastTimer);
        actionButton.disabled = true;
        try {
          await onAction();
        } catch (error) {
          showToast(error.message || "\u5143\u306B\u623B\u305B\u307E\u305B\u3093\u3067\u3057\u305F");
        }
      }, { once: true });
      toast.append(actionButton);
    }
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
  }
  function reservationInputFromEvent(event) {
    return {
      customerName: event.customerName,
      trainerId: event.trainerId,
      startAt: event.startAt,
      endAt: event.endAt,
      duration: event.duration,
      type: event.type,
      notes: event.notes || ""
    };
  }
  function showFormMessage(message) {
    const element = document.getElementById("formMessage");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("is-visible", Boolean(message));
    if (message) element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function askForConfirmation({ eyebrow = "\u5185\u5BB9\u78BA\u8A8D", title, summary, confirmLabel = "\u4FDD\u5B58\u3059\u308B", danger = false }) {
    return new Promise((resolve) => {
      const eyebrowElement = document.getElementById("confirmEyebrow");
      const titleElement = document.getElementById("confirmTitle");
      const summaryElement = document.getElementById("confirmSummary");
      const cancelButton = confirmDialog.querySelector("[data-dialog-cancel]");
      const confirmButton = confirmDialog.querySelector("[data-dialog-confirm]");
      eyebrowElement.textContent = eyebrow;
      titleElement.textContent = title;
      summaryElement.innerHTML = summary;
      confirmButton.textContent = confirmLabel;
      confirmButton.classList.toggle("button--danger-solid", danger);
      const finish = (result) => {
        cancelButton.removeEventListener("click", onCancel);
        confirmButton.removeEventListener("click", onConfirm);
        confirmDialog.removeEventListener("cancel", onCancel);
        if (confirmDialog.open) confirmDialog.close();
        resolve(result);
      };
      const onCancel = (event) => {
        event?.preventDefault();
        finish(false);
      };
      const onConfirm = () => finish(true);
      cancelButton.addEventListener("click", onCancel);
      confirmButton.addEventListener("click", onConfirm);
      confirmDialog.addEventListener("cancel", onCancel);
      confirmDialog.showModal();
    });
  }
  function ensureSyncErrorDialog() {
    let dialog = document.getElementById("syncErrorDialog");
    if (dialog) return dialog;
    document.body.insertAdjacentHTML("beforeend", `
    <dialog class="confirm-dialog sync-error-dialog" id="syncErrorDialog">
      <div class="confirm-dialog__body">
        <p class="eyebrow">\u540C\u671F\u30A8\u30E9\u30FC</p>
        <h2 data-sync-error-title>Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u53CD\u6620\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F</h2>
        <div class="confirm-dialog__summary" data-sync-error-summary></div>
        <div class="confirm-dialog__actions is-single">
          <button class="button button--danger-solid button--wide" type="button" data-sync-error-close>\u78BA\u8A8D\u3057\u307E\u3057\u305F</button>
        </div>
      </div>
    </dialog>
  `);
    dialog = document.getElementById("syncErrorDialog");
    const close = () => {
      if (dialog.open) dialog.close();
    };
    dialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-sync-error-close]")) close();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    return dialog;
  }
  function showSyncError({ title, event, error, rollbackMessage }) {
    const dialog = ensureSyncErrorDialog();
    const reason = escapeHtml(error?.message || "Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
    const name = escapeHtml(event?.customerName || "\u4E88\u7D04");
    const date = escapeHtml(String(event?.startAt || "").slice(0, 10));
    const time = escapeHtml(String(event?.startAt || "").slice(11, 16));
    dialog.querySelector("[data-sync-error-title]").textContent = title;
    dialog.querySelector("[data-sync-error-summary]").innerHTML = `
    <div class="sync-error-message">
      <p><strong>${name}</strong>${date && time ? `<br>${date} ${time}` : ""}</p>
      <p>${escapeHtml(rollbackMessage)}</p>
      <p class="sync-error-message__reason">\u7406\u7531\uFF1A${reason}</p>
    </div>
  `;
    if (!dialog.open) dialog.showModal();
  }
  function rerenderCalendarIfVisible() {
    const route = parseRoute();
    if (["month", "week", "day"].includes(route.name)) {
      void renderRoute();
    }
  }
  function observeMutation(mutation, { title, rollbackMessage }) {
    mutation.committed.then(() => rerenderCalendarIfVisible()).catch((error) => {
      rerenderCalendarIfVisible();
      showSyncError({
        title,
        event: mutation.event,
        error,
        rollbackMessage
      });
    });
  }
  function isStandaloneApp() {
    return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }
  function isIOSSafari() {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
    return isIOS && !isOtherIOSBrowser;
  }
  function installMode() {
    if (appState.isInstalled || isStandaloneApp()) return "";
    if (appState.installPrompt) return "android";
    if (isIOSSafari()) return "ios";
    return "";
  }
  function syncInstallBanner() {
    app.querySelector(".pwa-install-banner")?.remove();
    const mode = installMode();
    const main = app.querySelector(".app-main");
    if (!mode || !main) return;
    const label = mode === "android" ? "\u30A2\u30D7\u30EA\u3068\u3057\u3066\u8FFD\u52A0" : "\u30DB\u30FC\u30E0\u753B\u9762\u306B\u8FFD\u52A0";
    const description = mode === "android" ? "\u30DB\u30FC\u30E0\u753B\u9762\u304B\u3089\u3059\u3050\u958B\u3051\u307E\u3059" : "Safari\u306E\u5171\u6709\u30E1\u30CB\u30E5\u30FC\u304B\u3089\u8FFD\u52A0\u3067\u304D\u307E\u3059";
    main.insertAdjacentHTML("afterbegin", `
    <section class="pwa-install-banner" aria-label="\u30A2\u30D7\u30EA\u3068\u3057\u3066\u8FFD\u52A0">
      <div>
        <strong>${label}</strong>
        <span>${description}</span>
      </div>
      <button class="pwa-install-banner__button" type="button" data-action="install-app">\u8FFD\u52A0</button>
    </section>
  `);
  }
  async function installApp() {
    if (appState.installPrompt) {
      const prompt = appState.installPrompt;
      appState.installPrompt = null;
      await prompt.prompt();
      const result = await prompt.userChoice;
      syncInstallBanner();
      showToast(result.outcome === "accepted" ? "\u30A2\u30D7\u30EA\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F" : "\u8FFD\u52A0\u306F\u3044\u3064\u3067\u3082\u884C\u3048\u307E\u3059");
      return;
    }
    if (isIOSSafari() && pwaInstallDialog && !pwaInstallDialog.open) {
      pwaInstallDialog.showModal();
    }
  }
  async function renderRoute({ forceRefresh = false } = {}) {
    const renderId = ++pendingRender;
    const route = parseRoute();
    appState.route = route;
    const calendarConfig = calendarRouteConfig(route);
    if (calendarConfig) {
      try {
        await renderCalendarRoute(calendarConfig, renderId, forceRefresh);
      } catch (error) {
        if (renderId === pendingRender) {
          app.innerHTML = renderError(escapeHtml(error.message || "\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002"));
          setRouteLoading(false);
        }
      }
      return;
    }
    app.innerHTML = renderLoading();
    try {
      let html = "";
      if (route.name === "booking-new") {
        const date = currentDateForRoute(route);
        html = renderBookingForm({
          defaultDate: toISODate(date),
          defaultTrainerId: getOperatorProfile()?.trainerId ?? "tamai"
        });
      }
      if (route.name === "booking-edit") {
        const event = await repository.getEvent(route.id);
        if (!event) throw new Error("\u7DE8\u96C6\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
        html = renderBookingForm({ event, defaultDate: event.startAt.slice(0, 10) });
      }
      if (route.name === "history") {
        html = renderHistoryView(await repository.listHistory());
      }
      if (renderId === pendingRender) {
        app.innerHTML = html;
        syncInstallBanner();
        window.scrollTo({ top: 0, behavior: "instant" });
        syncBookingTypeField();
      }
    } catch (error) {
      if (renderId === pendingRender) {
        app.innerHTML = renderError(escapeHtml(error.message || "\u4E0D\u660E\u306A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002"));
      }
    }
  }
  function syncBookingTypeField() {
    const typeSelect = document.getElementById("bookingType");
    const nameInput = document.getElementById("customerName");
    if (!typeSelect || !nameInput) return;
    const isSchedule = ["blocked", "tentative", "event"].includes(typeSelect.value);
    nameInput.required = true;
    nameInput.placeholder = isSchedule ? "\u4F8B\uFF1A\u6E05\u6383\u30FB\u6253\u3061\u5408\u308F\u305B" : "\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50";
  }
  function bookingDateFromContext(button) {
    if (button?.dataset.date && isValidISODate(button.dataset.date)) return button.dataset.date;
    const route = parseRoute();
    if ((route.name === "day" || route.name === "week") && isValidISODate(route.date)) return route.date;
    if (route.name === "month") {
      const anchor = parseMonthRoute(route.month);
      const today = /* @__PURE__ */ new Date();
      return anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear() ? toISODate(today) : toISODate(anchor);
    }
    return toISODate(/* @__PURE__ */ new Date());
  }
  async function handleAction(button) {
    const action = button.dataset.action;
    const route = parseRoute();
    if (action === "previous-month" || action === "next-month") {
      const offset = action === "previous-month" ? -1 : 1;
      navigate(`month/${monthRouteValue(addMonths(parseMonthRoute(route.month), offset))}`);
    }
    if (action === "previous-week" || action === "next-week") {
      const offset = action === "previous-week" ? -7 : 7;
      navigate(`week/${toISODate(addDays(currentDateForRoute(route), offset))}`);
    }
    if (action === "today") {
      const today = /* @__PURE__ */ new Date();
      navigate(route.name === "week" ? `week/${toISODate(today)}` : `month/${monthRouteValue(today)}`);
    }
    if (action === "go-home") {
      navigate(`month/${monthRouteValue(/* @__PURE__ */ new Date())}`);
    }
    if (action === "install-app") {
      await installApp();
    }
    if (action === "change-operator") {
      const operator = await chooseOperator();
      if (operator) {
        await renderRoute();
        showToast(`\u3053\u306E\u7AEF\u672B\u3092\u300C${operator.name}\u300D\u306B\u5909\u66F4\u3057\u307E\u3057\u305F`);
      }
    }
    if (action === "show-month") {
      navigate(`month/${monthRouteValue(currentDateForRoute(route))}`);
    }
    if (action === "show-week") {
      navigate(`week/${toISODate(currentDateForRoute(route))}`);
    }
    if (action === "open-day") {
      lastCalendarHash = window.location.hash;
      navigate(`day/${button.dataset.date}`);
    }
    if (action === "new-booking") {
      rememberReturnLocation();
      navigate(`booking/new?date=${bookingDateFromContext(button)}`);
    }
    if (action === "edit-booking") {
      rememberReturnLocation();
      navigate(`booking/edit/${encodeURIComponent(button.dataset.id)}`);
    }
    if (action === "back-to-calendar") {
      navigate((lastCalendarHash || `#/month/${monthRouteValue(currentDateForRoute(route))}`).replace(/^#\//, ""));
    }
    if (action === "open-history") {
      rememberReturnLocation();
      navigate("history");
    }
    if (action === "back-from-form") {
      navigate(getReturnLocation().replace(/^#\//, ""));
    }
    if (action === "reload") {
      renderRoute({ forceRefresh: true });
    }
    if (action === "delete-booking") {
      const event = await repository.getEvent(button.dataset.id);
      if (!event) return;
      const confirmed = await askForConfirmation({
        eyebrow: "\u4E88\u7D04\u306E\u524A\u9664",
        title: "\u3053\u306E\u4E88\u7D04\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F",
        summary: `
        <dl>
          <div><dt>\u304A\u5BA2\u69D8</dt><dd>${escapeHtml(event.customerName)}</dd></div>
          <div><dt>\u65E5\u6642</dt><dd>${escapeHtml(event.startAt.slice(0, 10))} ${escapeHtml(event.startAt.slice(11, 16))}</dd></div>
        </dl>
      `,
        confirmLabel: "\u524A\u9664\u3059\u308B",
        danger: true
      });
      if (!confirmed) return;
      const mutation = await repository.deleteEventOptimistic(event.id);
      navigate(`day/${event.startAt.slice(0, 10)}`);
      showToast("\u4E88\u7D04\u3092\u524A\u9664\u3057\u307E\u3057\u305F", {
        duration: 8e3,
        actionLabel: "\u5143\u306B\u623B\u3059",
        onAction: async () => {
          try {
            await mutation.committed;
          } catch {
            return;
          }
          const restore = repository.createEventOptimistic(reservationInputFromEvent(event));
          navigate(`day/${event.startAt.slice(0, 10)}`);
          showToast("\u4E88\u7D04\u3092\u5FA9\u5143\u3057\u307E\u3057\u305F");
          observeMutation(restore, {
            title: "\u4E88\u7D04\u3092\u5FA9\u5143\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",
            rollbackMessage: "\u5FA9\u5143\u7528\u306E\u4EEE\u4E88\u7D04\u3092\u53D6\u308A\u6D88\u3057\u307E\u3057\u305F\u3002"
          });
        }
      });
      observeMutation(mutation, {
        title: "\u4E88\u7D04\u3092\u524A\u9664\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",
        rollbackMessage: "\u524A\u9664\u524D\u306E\u4E88\u7D04\u3092\u753B\u9762\u306B\u623B\u3057\u307E\u3057\u305F\u3002"
      });
    }
  }
  async function handleBookingSubmit(form) {
    showFormMessage("");
    const formData = new FormData(form);
    const eventId = form.dataset.eventId || null;
    const date = formData.get("date");
    const time = formData.get("time");
    const duration = Number(formData.get("duration"));
    const type = formData.get("type");
    const customerName = String(formData.get("customerName") || "").trim();
    const startAt = combineDateAndTime(date, time);
    const input = {
      customerName,
      trainerId: formData.get("trainerId"),
      startAt,
      endAt: addMinutesToDateTime(startAt, duration),
      duration,
      type,
      notes: String(formData.get("notes") || "").trim()
    };
    if (!customerName) {
      showFormMessage("\u304A\u5BA2\u69D8\u540D\u307E\u305F\u306F\u4E88\u5B9A\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
      return;
    }
    const analysis = repository.analyzeBooking ? await repository.analyzeBooking(input, eventId) : {
      conflicts: await repository.findConflicts(input, eventId),
      bufferWarnings: await repository.findBufferWarnings(input, eventId)
    };
    if (analysis.conflicts.length) {
      const conflict = analysis.conflicts[0];
      showFormMessage(`\u540C\u3058\u62C5\u5F53\u8005\u306B ${conflict.startAt.slice(11, 16)}\u301C${conflict.endAt.slice(11, 16)} \u306E\u4E88\u7D04\u304C\u3042\u308A\u307E\u3059\u3002\u6642\u9593\u3092\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
      return;
    }
    const bufferWarnings = analysis.bufferWarnings;
    const bufferWarningSummary = bufferWarnings.length ? `
    <div class="booking-buffer-warning" role="note">
      <strong>\u524D\u5F8C30\u5206\u306E\u78BA\u8A8D</strong>
      <p>\u540C\u3058\u62C5\u5F53\u8005\u306E\u4E88\u7D04\u306830\u5206\u672A\u6E80\u306E\u9593\u9694\u3067\u3059\u3002\u6E96\u5099\u30FB\u79FB\u52D5\u6642\u9593\u3092\u78BA\u8A8D\u3057\u3001\u554F\u984C\u306A\u3051\u308C\u3070\u3053\u306E\u307E\u307E\u767B\u9332\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p>
      <ul>
        ${bufferWarnings.map((event) => `<li>${escapeHtml(event.startAt.slice(11, 16))}\u301C${escapeHtml(event.endAt.slice(11, 16))}</li>`).join("")}
      </ul>
    </div>
  ` : "";
    const trainer = TRAINERS.find((item) => item.id === input.trainerId);
    const bookingType = BOOKING_TYPES.find((item) => item.id === input.type);
    const confirmed = await askForConfirmation({
      title: eventId ? "\u5909\u66F4\u5185\u5BB9\u3092\u4FDD\u5B58\u3057\u307E\u3059\u304B\uFF1F" : "\u3053\u306E\u5185\u5BB9\u3067\u4E88\u7D04\u3057\u307E\u3059\u304B\uFF1F",
      summary: `
      <dl>
        <div><dt>\u304A\u5BA2\u69D8</dt><dd>${escapeHtml(input.customerName)}</dd></div>
        <div><dt>\u65E5\u6642</dt><dd>${escapeHtml(formatDayTitle(parseISODate(date)))}<br>${escapeHtml(time)}\u301C${escapeHtml(input.endAt.slice(11, 16))}</dd></div>
        <div><dt>\u62C5\u5F53</dt><dd>${escapeHtml(trainer?.name || "\u6307\u5B9A\u306A\u3057")}</dd></div>
        <div><dt>\u7A2E\u985E</dt><dd>${escapeHtml(bookingType?.name || "\u901A\u5E38\u4E88\u7D04")}</dd></div>
      </dl>
      ${bufferWarningSummary}
    `,
      confirmLabel: eventId ? "\u5909\u66F4\u3092\u4FDD\u5B58" : "\u4E88\u7D04\u3092\u767B\u9332"
    });
    if (!confirmed) return;
    if (eventId) {
      const mutation = await repository.updateEventOptimistic(eventId, input);
      navigate(`day/${date}`);
      showToast("\u4E88\u7D04\u3092\u5909\u66F4\u3057\u307E\u3057\u305F");
      observeMutation(mutation, {
        title: "\u4E88\u7D04\u306E\u5909\u66F4\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",
        rollbackMessage: "\u5909\u66F4\u524D\u306E\u4E88\u7D04\u5185\u5BB9\u306B\u623B\u3057\u307E\u3057\u305F\u3002"
      });
    } else {
      const mutation = repository.createEventOptimistic(input);
      navigate(`day/${date}`);
      showToast("\u4E88\u7D04\u3092\u767B\u9332\u3057\u307E\u3057\u305F");
      observeMutation(mutation, {
        title: "\u4E88\u7D04\u3092\u767B\u9332\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",
        rollbackMessage: "\u753B\u9762\u4E0A\u306E\u4EEE\u4E88\u7D04\u3092\u53D6\u308A\u6D88\u3057\u307E\u3057\u305F\u3002"
      });
    }
  }
  app.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    handleAction(button).catch((error) => showToast(error.message || "\u64CD\u4F5C\u306B\u5931\u6557\u3057\u307E\u3057\u305F"));
  });
  app.addEventListener("submit", (event) => {
    if (event.target.id !== "bookingForm") return;
    event.preventDefault();
    handleBookingSubmit(event.target).catch((error) => showFormMessage(error.message || "\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002"));
  });
  app.addEventListener("change", (event) => {
    if (event.target.id === "bookingType") syncBookingTypeField();
  });
  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("online", () => {
    const route = parseRoute();
    if (["month", "week", "day"].includes(route.name)) void renderRoute({ forceRefresh: true });
  });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    appState.installPrompt = event;
    syncInstallBanner();
  });
  window.addEventListener("appinstalled", () => {
    appState.installPrompt = null;
    appState.isInstalled = true;
    syncInstallBanner();
    showToast("\u30A2\u30D7\u30EA\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F");
  });
  pwaInstallDialog?.addEventListener("click", (event) => {
    if (event.target.closest("[data-pwa-dialog-close]")) pwaInstallDialog.close();
  });
  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
  }
  async function startApp() {
    if (!loadOperatorId()) await chooseOperator({ required: true });
    if (!window.location.hash) {
      navigate(`month/${monthRouteValue(/* @__PURE__ */ new Date())}`, { replace: true });
    } else {
      renderRoute();
    }
  }
  startApp().catch((error) => {
    app.innerHTML = renderError(escapeHtml(error.message || "\u30A2\u30D7\u30EA\u3092\u8D77\u52D5\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002"));
  });
})();
