const BROAD_STARTUP_RANGE_DAYS = 90;
const IDLE_TIMEOUT_MS = 1200;
const FALLBACK_DELAY_MS = 350;
const DAY_MS = 86_400_000;

function rangeLengthDays(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.round((end - start) / DAY_MS);
}

export function scheduleStartupBackgroundTask(callback, {
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

export function withStartupPriority(repository, { windowRef = globalThis.window } = {}) {
  let initialHistoryDeferred = false;
  let cancelDeferredHistory = null;
  let broadRefreshScheduled = false;

  const schedule = (callback, options = {}) => scheduleStartupBackgroundTask(callback, { windowRef, ...options });

  return new Proxy(repository, {
    get(target, property, receiver) {
      if (property === "refreshEvents") {
        return (startDate, endDate) => {
          const broadStartupRead = rangeLengthDays(startDate, endDate) > BROAD_STARTUP_RANGE_DAYS;
          if (!broadStartupRead) return target.refreshEvents(startDate, endDate);

          if (!broadRefreshScheduled) {
            broadRefreshScheduled = true;
            schedule(() => {
              broadRefreshScheduled = false;
              target.refreshEvents(startDate, endDate).catch(() => {});
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
              target.refreshHistory(...args).catch(() => {});
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
