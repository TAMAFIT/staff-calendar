(() => {
  // src/config.js
  var APP_NAME = "\u305F\u307E\u30D5\u30A3\u30C3\u30C8\u4E88\u7D04";
  var GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQf3thjGYKpV13bH6V0n1ZKQT23Wvvx8K7CQhRNIuH6mAQwih9Cg28r3ETnz9AVB4Etw/exec";
  var TRAINERS = [
    { id: "tamai", name: "\u7389\u4E95", shortName: "\u7389\u4E95", color: "green" },
    { id: "obayashi", name: "\u5927\u6797", shortName: "\u5927\u6797", color: "blue" }
  ];
  var BOOKING_TYPES = [
    { id: "member", name: "\u901A\u5E38\u4E88\u7D04" },
    { id: "trial", name: "\u4F53\u9A13" },
    { id: "consultation", name: "\u898B\u5B66\u30FB\u76F8\u8AC7" },
    { id: "blocked", name: "\u4E88\u5B9A\u30D6\u30ED\u30C3\u30AF" }
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
    installPrompt: null
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
  };

  // src/services/google-calendar-repository.js
  function isConfigured(url) {
    return /^https:\/\/script\.google\.com\/macros\/s\//.test(String(url || ""));
  }
  function ensureConfigured(url) {
    if (isConfigured(url)) return;
    throw new Error("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u9023\u643A\u306EURL\u304C\u672A\u8A2D\u5B9A\u3067\u3059\u3002Apps Script\u3092\u30C7\u30D7\u30ED\u30A4\u3057\u3066\u304B\u3089 src/config.js \u306B /exec URL \u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  function ensureSuccess(payload) {
    if (payload?.status === "success") return payload;
    throw new Error(payload?.message || "Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u306E\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
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
      const response = await this.fetchImpl(url, { method: "GET", redirect: "follow" });
      if (!response.ok) throw new Error("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      return ensureSuccess(await response.json());
    }
    async post(action, data = {}) {
      ensureConfigured(this.endpoint);
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        redirect: "follow",
        // Do not add a Content-Type header. This keeps the Apps Script request CORS-simple.
        body: JSON.stringify({ action, ...data })
      });
      if (!response.ok) throw new Error("Google\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      return ensureSuccess(await response.json());
    }
    async listEvents(startDate, endDate) {
      const response = await this.get("staffCalendarList", { startDate, endDate });
      return response.events || [];
    }
    async getEvent(id) {
      const response = await this.get("staffCalendarGet", { id });
      return response.event || null;
    }
    async createEvent(input) {
      const response = await this.post("staffCalendarCreate", { event: input });
      return response.event;
    }
    async updateEvent(id, input) {
      const response = await this.post("staffCalendarUpdate", { id, event: input });
      return response.event;
    }
    async deleteEvent(id) {
      await this.post("staffCalendarDelete", { id });
    }
    async findConflicts(candidate, excludeId = null) {
      const date = candidate.startAt.slice(0, 10);
      const events = await this.listEvents(date, date);
      return events.filter((event) => {
        if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
        return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
      });
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
      return event;
    }
    async updateEvent(id, input) {
      const events = this.readAll();
      const index = events.findIndex((event) => event.id === id);
      if (index < 0) throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      events[index] = { ...events[index], ...input, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      this.writeAll(events);
      return events[index];
    }
    async deleteEvent(id) {
      const events = this.readAll();
      const next = events.filter((event) => event.id !== id);
      if (next.length === events.length) throw new Error("\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      this.writeAll(next);
    }
    async findConflicts(candidate, excludeId = null) {
      return this.readAll().filter((event) => {
        if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
        return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
      });
    }
    async resetDemoData() {
      const seeded = createMockEvents();
      this.writeAll(seeded);
      return seeded;
    }
  };

  // src/services/repository-factory.js
  function createCalendarRepository() {
    if (window.location.protocol === "file:" && !window.TAMAFIT_USE_LIVE_CALENDAR) {
      return new LocalCalendarRepository();
    }
    return new GoogleCalendarRepository();
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
    showAdd = true
  } = {}) {
    return `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__inner">
          ${backAction ? `
            <button class="icon-button" type="button" data-action="${backAction}" aria-label="\u524D\u306E\u753B\u9762\u3078\u623B\u308B">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          ` : `<div class="brand-mark" aria-hidden="true">T</div>`}
          <div class="app-header__copy">
            <span>${subtitle}</span>
            <strong>${title}</strong>
          </div>
          ${showAdd ? `
            <button class="header-add-button" type="button" data-action="new-booking" aria-label="\u4E88\u7D04\u3092\u8FFD\u52A0">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          ` : `<span class="app-header__spacer" aria-hidden="true"></span>`}
        </div>
      </header>
      <main class="app-main">${content}</main>
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
  function renderBookingForm({ event = null, defaultDate }) {
    const isEditing = Boolean(event);
    const startParts = event ? dateTimeToParts(event.startAt) : { date: defaultDate, time: "10:00" };
    const type = event?.type || "member";
    const isBlocked = type === "blocked";
    const times = createTimeOptions(OPENING_TIME, CLOSING_TIME, TIME_STEP_MINUTES);
    const content = `
    <section class="booking-form-view">
      <div class="form-heading">
        <p class="eyebrow">${isEditing ? "\u4E88\u7D04\u5185\u5BB9\u306E\u5909\u66F4" : "\u65B0\u3057\u3044\u4E88\u7D04"}</p>
        <h1>${isEditing ? "\u4E88\u7D04\u3092\u7DE8\u96C6" : "\u4E88\u7D04\u3092\u8FFD\u52A0"}</h1>
        <p>\u5FC5\u8981\u306A\u5185\u5BB9\u3060\u3051\u5165\u529B\u3057\u3066\u3001Google\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u540C\u3058\u611F\u899A\u3067\u767B\u9332\u3067\u304D\u307E\u3059\u3002</p>
      </div>

      <form class="booking-form" id="bookingForm" data-event-id="${escapeAttribute(event?.id || "")}">
        <div class="field field--full">
          <label for="customerName">\u304A\u5BA2\u69D8\u540D</label>
          <input id="customerName" name="customerName" type="text" value="${escapeAttribute(event?.customerName || "")}" placeholder="\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50" autocomplete="off" ${isBlocked ? "" : "required"}>
          <small>\u4E88\u5B9A\u30D6\u30ED\u30C3\u30AF\u306E\u5834\u5408\u306F\u3001\u7528\u9014\u3092\u5165\u529B\u3067\u304D\u307E\u3059\u3002</small>
        </div>

        <div class="field field--full">
          <label for="trainerId">\u62C5\u5F53\u30C8\u30EC\u30FC\u30CA\u30FC</label>
          <div class="select-wrap">
            <select id="trainerId" name="trainerId" required>
              ${TRAINERS.map((trainer) => `<option value="${trainer.id}" ${event?.trainerId === trainer.id ? "selected" : ""}>${escapeHtml(trainer.name)}</option>`).join("")}
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
          <button class="button button--primary ${isEditing ? "" : "button--wide"}" type="submit">\u4E88\u7D04\u5185\u5BB9\u3092\u78BA\u8A8D\u3059\u308B</button>
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
    const color = event.type === "blocked" ? "neutral" : event.type === "trial" ? "amber" : trainer?.color || "neutral";
    return `
    <button class="day-event day-event--${color}" type="button" data-action="edit-booking" data-id="${event.id}">
      <span class="day-event__time">
        <strong>${event.startAt.slice(11, 16)}</strong>
        <small>${event.endAt.slice(11, 16)}</small>
      </span>
      <span class="day-event__line" aria-hidden="true"></span>
      <span class="day-event__content">
        <span class="day-event__badges">
          <small>${escapeHtml(trainer?.name || "\u62C5\u5F53\u672A\u5B9A")}</small>
          <small>${escapeHtml(type.name)}</small>
        </span>
        <strong>${escapeHtml(event.type === "blocked" ? type.name : `${event.customerName} \u69D8`)}</strong>
        <span>${event.duration}\u5206${event.notes ? `\u30FB${escapeHtml(event.notes)}` : ""}</span>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  `;
  }
  function renderDayView(date, events) {
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

      <button class="button button--primary button--wide day-add-button" type="button" data-action="new-booking" data-date="${toISODate(date)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        \u3053\u306E\u65E5\u306B\u4E88\u7D04\u3092\u8FFD\u52A0
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
    const type = getBookingType(event.type);
    const time = event.startAt.slice(11, 16);
    const displayName = event.type === "blocked" ? type.name : event.customerName.split(/[ 　]/)[0];
    const color = event.type === "blocked" ? "neutral" : event.type === "trial" ? "amber" : trainer?.color || "neutral";
    return `
    <span class="month-event month-event--${color}" title="${escapeAttribute(`${time} ${event.customerName}`)}">
      <b>${escapeHtml(time)}</b><span>${escapeHtml(displayName)}</span>
    </span>
  `;
  }
  function renderMonthView(anchorDate, events) {
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
        <button class="today-button" type="button" data-action="today">\u4ECA\u65E5</button>
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
    const type = getBookingType(event.type);
    const color = event.type === "blocked" ? "neutral" : event.type === "trial" ? "amber" : trainer?.color || "neutral";
    return `
    <div class="week-event week-event--${color}">
      <time>${event.startAt.slice(11, 16)}</time>
      <span class="week-event__main">
        <strong>${escapeHtml(event.type === "blocked" ? type.name : event.customerName)}</strong>
        <small>${escapeHtml(trainer?.name || "\u62C5\u5F53\u672A\u5B9A")}\u30FB${event.duration}\u5206</small>
      </span>
    </div>
  `;
  }
  function renderWeekView(anchorDate, events) {
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
        <button class="today-button" type="button" data-action="today">\u4ECA\u65E5</button>
      </div>

      <div class="view-switch" aria-label="\u30AB\u30EC\u30F3\u30C0\u30FC\u8868\u793A">
        <button type="button" data-action="show-month" aria-pressed="false">\u6708\u9593</button>
        <button class="is-active" type="button" data-action="show-week" aria-pressed="true">\u9031\u9593</button>
      </div>

      <div class="week-list">${dayRows}</div>
    </section>
  `;
    return renderAppShell(content);
  }

  // src/app.js
  var app = document.getElementById("app");
  var repository = createCalendarRepository();
  var confirmDialog = document.getElementById("confirmDialog");
  var toast = document.getElementById("toast");
  var lastCalendarHash = "";
  var pendingRender = 0;
  var toastTimer = null;
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
  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
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
  async function renderRoute() {
    const renderId = ++pendingRender;
    const route = parseRoute();
    appState.route = route;
    app.innerHTML = renderLoading();
    try {
      let html = "";
      if (route.name === "month") {
        const anchor = parseMonthRoute(route.month);
        const days = getMonthGrid(anchor);
        const events = await repository.listEvents(toISODate(days[0]), toISODate(days.at(-1)));
        html = renderMonthView(anchor, events);
        lastCalendarHash = window.location.hash;
        saveLastView("month");
      }
      if (route.name === "week") {
        const anchor = currentDateForRoute(route);
        const days = getWeekDays(anchor);
        const events = await repository.listEvents(toISODate(days[0]), toISODate(days.at(-1)));
        html = renderWeekView(anchor, events);
        lastCalendarHash = window.location.hash;
        saveLastView("week");
      }
      if (route.name === "day") {
        const date = currentDateForRoute(route);
        const isoDate = toISODate(date);
        const events = await repository.listEvents(isoDate, isoDate);
        html = renderDayView(date, events);
      }
      if (route.name === "booking-new") {
        const date = currentDateForRoute(route);
        html = renderBookingForm({ defaultDate: toISODate(date) });
      }
      if (route.name === "booking-edit") {
        const event = await repository.getEvent(route.id);
        if (!event) throw new Error("\u7DE8\u96C6\u3059\u308B\u4E88\u7D04\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
        html = renderBookingForm({ event, defaultDate: event.startAt.slice(0, 10) });
      }
      if (renderId === pendingRender) {
        app.innerHTML = html;
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
    const isBlocked = typeSelect.value === "blocked";
    nameInput.required = !isBlocked;
    nameInput.placeholder = isBlocked ? "\u4F8B\uFF1A\u6E05\u6383\u30FB\u6253\u3061\u5408\u308F\u305B" : "\u4F8B\uFF1A\u5C71\u7530 \u82B1\u5B50";
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
    if (action === "back-from-form") {
      navigate(getReturnLocation().replace(/^#\//, ""));
    }
    if (action === "reload") {
      renderRoute();
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
      await repository.deleteEvent(event.id);
      showToast("\u4E88\u7D04\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
      navigate(`day/${event.startAt.slice(0, 10)}`);
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
    const customerName = String(formData.get("customerName") || "").trim() || (type === "blocked" ? "\u4E88\u5B9A\u30D6\u30ED\u30C3\u30AF" : "");
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
      showFormMessage("\u304A\u5BA2\u69D8\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
      return;
    }
    const conflicts = await repository.findConflicts(input, eventId);
    if (conflicts.length) {
      const conflict = conflicts[0];
      showFormMessage(`\u540C\u3058\u62C5\u5F53\u8005\u306B ${conflict.startAt.slice(11, 16)}\u301C${conflict.endAt.slice(11, 16)} \u306E\u4E88\u7D04\u304C\u3042\u308A\u307E\u3059\u3002\u6642\u9593\u3092\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
      return;
    }
    const trainer = TRAINERS.find((item) => item.id === input.trainerId);
    const bookingType = BOOKING_TYPES.find((item) => item.id === input.type);
    const confirmed = await askForConfirmation({
      title: eventId ? "\u5909\u66F4\u5185\u5BB9\u3092\u4FDD\u5B58\u3057\u307E\u3059\u304B\uFF1F" : "\u3053\u306E\u5185\u5BB9\u3067\u4E88\u7D04\u3057\u307E\u3059\u304B\uFF1F",
      summary: `
      <dl>
        <div><dt>\u304A\u5BA2\u69D8</dt><dd>${escapeHtml(input.customerName)}</dd></div>
        <div><dt>\u65E5\u6642</dt><dd>${escapeHtml(formatDayTitle(parseISODate(date)))}<br>${escapeHtml(time)}\u301C${escapeHtml(input.endAt.slice(11, 16))}</dd></div>
        <div><dt>\u62C5\u5F53</dt><dd>${escapeHtml(trainer?.name || "\u62C5\u5F53\u672A\u5B9A")}</dd></div>
        <div><dt>\u7A2E\u985E</dt><dd>${escapeHtml(bookingType?.name || "\u901A\u5E38\u4E88\u7D04")}</dd></div>
      </dl>
    `,
      confirmLabel: eventId ? "\u5909\u66F4\u3092\u4FDD\u5B58" : "\u4E88\u7D04\u3092\u767B\u9332"
    });
    if (!confirmed) return;
    if (eventId) {
      await repository.updateEvent(eventId, input);
      showToast("\u4E88\u7D04\u3092\u5909\u66F4\u3057\u307E\u3057\u305F");
    } else {
      await repository.createEvent(input);
      showToast("\u4E88\u7D04\u3092\u767B\u9332\u3057\u307E\u3057\u305F");
    }
    navigate(`day/${date}`);
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
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    appState.installPrompt = event;
  });
  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
  }
  if (!window.location.hash) {
    navigate(`month/${monthRouteValue(/* @__PURE__ */ new Date())}`, { replace: true });
  } else {
    renderRoute();
  }
})();
