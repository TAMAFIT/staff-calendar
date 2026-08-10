const TRACKED_RANGE_MAX_DAYS = 70;
const SHOW_DELAY_MS = 220;

function parseDateUtc(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function rangeDays(startDate, endDate) {
  const start = parseDateUtc(startDate);
  const end = parseDateUtc(endDate);
  if (!start || !end) return Infinity;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
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

export function rangeMatchesCalendarRoute(range, hash) {
  const anchor = calendarRouteAnchor(hash);
  if (!anchor || !range?.startDate || !range?.endDate) return false;
  return range.startDate <= anchor && anchor <= range.endDate;
}

function ensureStyles(documentRef) {
  if (documentRef.getElementById("calendarFetchStatusStyles")) return;
  const style = documentRef.createElement("style");
  style.id = "calendarFetchStatusStyles";
  style.textContent = `
    .calendar-fetch-status {
      position: fixed;
      z-index: 95;
      top: calc(var(--safe-top, 0px) + 76px);
      right: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 34px;
      padding: 7px 11px;
      border: 1px solid rgba(13, 143, 77, 0.14);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.96);
      color: var(--green-900, #0d6338);
      box-shadow: 0 5px 16px rgba(20, 64, 38, 0.14);
      font-size: 11px;
      font-weight: 900;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-5px);
      transition: opacity 150ms ease, transform 150ms ease;
      white-space: nowrap;
    }

    .calendar-fetch-status.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .calendar-fetch-status__spinner {
      width: 14px;
      height: 14px;
      flex: 0 0 14px;
      border: 2px solid var(--green-100, #d9f0e3);
      border-top-color: var(--green-700, #0d8f4d);
      border-radius: 50%;
      animation: calendar-fetch-spin 0.72s linear infinite;
    }

    @keyframes calendar-fetch-spin {
      to { transform: rotate(360deg); }
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
  indicator.innerHTML = `<span class="calendar-fetch-status__spinner" aria-hidden="true"></span><span>予定を読み込み中</span>`;
  documentRef.body.appendChild(indicator);
  return indicator;
}

export function installCalendarFetchStatus({
  globalRef = globalThis,
  documentRef = globalThis.document,
  locationRef = globalThis.location
} = {}) {
  if (!globalRef?.fetch || !documentRef || !locationRef) return () => {};
  if (globalRef.__tamafitCalendarFetchStatusInstalled) return () => {};
  globalRef.__tamafitCalendarFetchStatusInstalled = true;

  const originalFetch = globalRef.fetch.bind(globalRef);
  const indicator = ensureIndicator(documentRef);
  const activeRanges = new Map();
  let requestId = 0;
  let showTimer = null;

  const hide = () => {
    clearTimeout(showTimer);
    showTimer = null;
    indicator.classList.remove("is-visible");
  };

  const syncVisibility = () => {
    const relevant = [...activeRanges.values()].some((range) => rangeMatchesCalendarRoute(range, locationRef.hash));
    if (!relevant) {
      hide();
      return;
    }
    if (indicator.classList.contains("is-visible") || showTimer) return;
    showTimer = setTimeout(() => {
      showTimer = null;
      const stillRelevant = [...activeRanges.values()].some((range) => rangeMatchesCalendarRoute(range, locationRef.hash));
      indicator.classList.toggle("is-visible", stillRelevant);
    }, SHOW_DELAY_MS);
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
