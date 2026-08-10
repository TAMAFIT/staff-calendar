const TRACKED_RANGE_MAX_DAYS = 70;
const INITIAL_SHOW_DELAY_MS = 80;
const REFRESH_SHOW_DELAY_MS = 350;
const SLOW_LOAD_MS = 8_000;
const COVERAGE_STORAGE_KEY = "tamafit_staff_calendar_local_first_v1:coverage";
const DAY_MS = 86_400_000;

function parseDateUtc(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateUtc(date) {
  return date.toISOString().slice(0, 10);
}

function rangeDays(startDate, endDate) {
  const start = parseDateUtc(startDate);
  const end = parseDateUtc(endDate);
  if (!start || !end) return Infinity;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function calendarRangeFromRequest(input, init = {}) {
  const method = String(init?.method || input?.method || "GET").toUpperCase();
  if (method !== "GET") return null;

  let url;
  try {
    url = new URL(typeof input === "string" || input instanceof URL ? String(input) : input?.url || "");
  } catch {
    return null;
  }

  if (url.hostname !== "script.google.com") return null;
  if (url.searchParams.get("action") !== "staffCalendarList") return null;

  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";
  const days = rangeDays(startDate, endDate);
  if (!Number.isFinite(days) || days < 1 || days > TRACKED_RANGE_MAX_DAYS) return null;

  return { startDate, endDate };
}

export function calendarRouteAnchor(hash) {
  const value = String(hash || "");
  const month = value.match(/^#\/month\/(\d{4})-(\d{2})/);
  if (month) return `${month[1]}-${month[2]}-01`;

  const dated = value.match(/^#\/(?:week|day)\/(\d{4}-\d{2}-\d{2})/);
  return dated ? dated[1] : "";
}

export function calendarRouteRange(hash) {
  const value = String(hash || "");
  const month = value.match(/^#\/month\/(\d{4})-(\d{2})/);
  if (month) {
    const first = new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1));
    const last = new Date(Date.UTC(Number(month[1]), Number(month[2]), 0));
    return { startDate: formatDateUtc(first), endDate: formatDateUtc(last) };
  }

  const week = value.match(/^#\/week\/(\d{4}-\d{2}-\d{2})/);
  if (week) {
    const anchor = parseDateUtc(week[1]);
    if (!anchor) return null;
    const start = new Date(anchor.getTime() - (anchor.getUTCDay() * DAY_MS));
    const end = new Date(start.getTime() + (6 * DAY_MS));
    return { startDate: formatDateUtc(start), endDate: formatDateUtc(end) };
  }

  const day = value.match(/^#\/day\/(\d{4}-\d{2}-\d{2})/);
  return day ? { startDate: day[1], endDate: day[1] } : null;
}

export function calendarRouteLabel(hash) {
  const value = String(hash || "");
  const month = value.match(/^#\/month\/(\d{4})-(\d{2})/);
  if (month) return `${Number(month[2])}月`;
  if (/^#\/week\//.test(value)) return "この週";
  if (/^#\/day\//.test(value)) return "この日";
  return "予定";
}

export function rangeMatchesCalendarRoute(range, hash) {
  const routeRange = calendarRouteRange(hash);
  if (!routeRange || !range?.startDate || !range?.endDate) return false;
  return range.startDate <= routeRange.startDate && range.endDate >= routeRange.endDate;
}

function readCoverage(storage) {
  try {
    const value = JSON.parse(storage?.getItem(COVERAGE_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function hasCachedCoverageForRoute(storage, hash) {
  const routeRange = calendarRouteRange(hash);
  if (!routeRange) return false;
  return readCoverage(storage).some((item) => (
    item?.startDate <= routeRange.startDate
    && item?.endDate >= routeRange.endDate
    && Number(item?.fetchedAt || 0) > 0
  ));
}

function ensureStyles(documentRef) {
  if (documentRef.getElementById("calendarFetchStatusStyles")) return;
  const style = documentRef.createElement("style");
  style.id = "calendarFetchStatusStyles";
  style.textContent = `
    .calendar-fetch-status {
      position: fixed;
      z-index: 95;
      opacity: 0;
      pointer-events: none;
      transition: opacity 160ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .calendar-fetch-status.is-visible {
      opacity: 1;
    }

    .calendar-fetch-status.is-large {
      top: calc(var(--safe-top, 0px) + 190px);
      left: 50%;
      display: flex;
      width: min(82vw, 370px);
      min-height: 176px;
      align-items: center;
      justify-content: center;
      padding: 24px 22px;
      border: 1px solid rgba(13, 143, 77, 0.16);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.94);
      color: var(--green-950, #084d2d);
      box-shadow: 0 14px 38px rgba(20, 64, 38, 0.18);
      backdrop-filter: blur(10px);
      flex-direction: column;
      text-align: center;
      transform: translate(-50%, -8px) scale(0.985);
    }

    .calendar-fetch-status.is-large.is-visible {
      transform: translate(-50%, 0) scale(1);
    }

    .calendar-fetch-status.is-compact {
      top: calc(var(--safe-top, 0px) + 76px);
      right: 14px;
      display: inline-flex;
      min-height: 34px;
      align-items: center;
      padding: 7px 11px;
      gap: 8px;
      border: 1px solid rgba(13, 143, 77, 0.14);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.96);
      color: var(--green-900, #0d6338);
      box-shadow: 0 5px 16px rgba(20, 64, 38, 0.14);
      font-size: 11px;
      font-weight: 900;
      transform: translateY(-5px);
      white-space: nowrap;
    }

    .calendar-fetch-status.is-compact.is-visible {
      transform: translateY(0);
    }

    .calendar-fetch-status__spinner {
      flex: 0 0 auto;
      border: 3px solid var(--green-100, #d9f0e3);
      border-top-color: var(--green-700, #0d8f4d);
      border-radius: 50%;
      animation: calendar-fetch-spin 0.72s linear infinite;
    }

    .calendar-fetch-status.is-large .calendar-fetch-status__spinner {
      width: 44px;
      height: 44px;
      margin-bottom: 17px;
      border-width: 4px;
    }

    .calendar-fetch-status.is-compact .calendar-fetch-status__spinner {
      width: 14px;
      height: 14px;
    }

    .calendar-fetch-status__copy {
      display: flex;
      flex-direction: column;
    }

    .calendar-fetch-status.is-large .calendar-fetch-status__title {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: -0.02em;
      line-height: 1.35;
    }

    .calendar-fetch-status.is-large .calendar-fetch-status__detail {
      margin-top: 7px;
      color: var(--ink-soft, #627067);
      font-size: 13px;
      font-weight: 700;
      line-height: 1.5;
    }

    .calendar-fetch-status.is-compact .calendar-fetch-status__title {
      font-size: 11px;
      font-weight: 900;
    }

    .calendar-fetch-status.is-compact .calendar-fetch-status__detail {
      display: none;
    }

    @keyframes calendar-fetch-spin {
      to { transform: rotate(360deg); }
    }

    @media (max-height: 650px) {
      .calendar-fetch-status.is-large {
        top: calc(var(--safe-top, 0px) + 150px);
        min-height: 154px;
      }
    }
  `;
  documentRef.head.appendChild(style);
}

function ensureIndicator(documentRef) {
  let indicator = documentRef.getElementById("calendarFetchStatus");
  if (indicator) return indicator;
  ensureStyles(documentRef);
  indicator = documentRef.createElement("div");
  indicator.id = "calendarFetchStatus";
  indicator.className = "calendar-fetch-status";
  indicator.setAttribute("role", "status");
  indicator.setAttribute("aria-live", "polite");
  indicator.innerHTML = `
    <span class="calendar-fetch-status__spinner" aria-hidden="true"></span>
    <span class="calendar-fetch-status__copy">
      <strong class="calendar-fetch-status__title"></strong>
      <span class="calendar-fetch-status__detail"></span>
    </span>
  `;
  documentRef.body.appendChild(indicator);
  return indicator;
}

export function installCalendarFetchStatus({
  globalRef = globalThis,
  documentRef = globalThis.document,
  locationRef = globalThis.location,
  storageRef = globalThis.localStorage
} = {}) {
  if (!globalRef?.fetch || !documentRef || !locationRef) return () => {};
  if (globalRef.__tamafitCalendarFetchStatusInstalled) return () => {};
  globalRef.__tamafitCalendarFetchStatusInstalled = true;

  const originalFetch = globalRef.fetch.bind(globalRef);
  const indicator = ensureIndicator(documentRef);
  const activeRanges = new Map();
  let requestId = 0;
  let showTimer = null;
  let slowTimer = null;

  const title = indicator.querySelector(".calendar-fetch-status__title");
  const detail = indicator.querySelector(".calendar-fetch-status__detail");

  const clearTimers = () => {
    clearTimeout(showTimer);
    clearTimeout(slowTimer);
    showTimer = null;
    slowTimer = null;
  };

  const hide = () => {
    clearTimers();
    indicator.classList.remove("is-visible", "is-large", "is-compact");
  };

  const relevantRangeExists = () => [...activeRanges.values()]
    .some((range) => rangeMatchesCalendarRoute(range, locationRef.hash));

  const show = (mode) => {
    const label = calendarRouteLabel(locationRef.hash);
    indicator.classList.remove("is-large", "is-compact");
    indicator.classList.add(mode === "initial" ? "is-large" : "is-compact");

    if (mode === "initial") {
      title.textContent = `${label}の予定を読み込んでいます`;
      detail.textContent = "カレンダーは移動済みです。そのままお待ちください";
      slowTimer = setTimeout(() => {
        if (!indicator.classList.contains("is-visible") || !relevantRangeExists()) return;
        title.textContent = "予定の読み込みに時間がかかっています";
        detail.textContent = "通信状況によって時間がかかる場合があります";
      }, SLOW_LOAD_MS);
    } else {
      title.textContent = "最新の予定を確認中";
      detail.textContent = "";
    }

    indicator.classList.add("is-visible");
  };

  const syncVisibility = () => {
    const routeAnchor = calendarRouteAnchor(locationRef.hash);
    if (!routeAnchor || !relevantRangeExists()) {
      hide();
      return;
    }

    const initial = !hasCachedCoverageForRoute(storageRef, locationRef.hash);
    const desiredClass = initial ? "is-large" : "is-compact";

    if (indicator.classList.contains("is-visible") && indicator.classList.contains(desiredClass)) return;

    clearTimers();
    indicator.classList.remove("is-visible", "is-large", "is-compact");
    showTimer = setTimeout(() => {
      showTimer = null;
      if (!relevantRangeExists()) return;
      const stillInitial = !hasCachedCoverageForRoute(storageRef, locationRef.hash);
      show(stillInitial ? "initial" : "refresh");
    }, initial ? INITIAL_SHOW_DELAY_MS : REFRESH_SHOW_DELAY_MS);
  };

  const trackedFetch = (input, init) => {
    const range = calendarRangeFromRequest(input, init);
    if (!range) return originalFetch(input, init);

    const id = ++requestId;
    activeRanges.set(id, range);
    syncVisibility();

    let request;
    try {
      request = originalFetch(input, init);
    } catch (error) {
      activeRanges.delete(id);
      syncVisibility();
      throw error;
    }

    return Promise.resolve(request).finally(() => {
      activeRanges.delete(id);
      syncVisibility();
    });
  };

  globalRef.fetch = trackedFetch;
  globalRef.addEventListener?.("hashchange", syncVisibility);

  return () => {
    hide();
    activeRanges.clear();
    globalRef.fetch = originalFetch;
    globalRef.removeEventListener?.("hashchange", syncVisibility);
    delete globalRef.__tamafitCalendarFetchStatusInstalled;
  };
}

if (typeof window !== "undefined") {
  installCalendarFetchStatus();
}
