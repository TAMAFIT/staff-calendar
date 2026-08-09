import { monthRouteValue, parseMonthRoute, toISODate } from "./utils/date.js";

export function weekAnchorForMonth(monthValue, now = new Date()) {
  const month = parseMonthRoute(monthValue);
  if (monthRouteValue(month) === monthRouteValue(now)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return month;
}

export function weekRouteForMonthToggle(hash, now = new Date()) {
  const match = String(hash || "").match(/^#\/month\/(\d{4}-\d{2})/);
  if (!match) return null;
  return `#/week/${toISODate(weekAnchorForMonth(match[1], now))}`;
}

export function installCalendarViewToggleGuard({ root = document, now = () => new Date() } = {}) {
  root.addEventListener("click", (event) => {
    const button = event.target.closest?.('[data-action="show-week"]');
    if (!button) return;

    const route = weekRouteForMonthToggle(window.location.hash, now());
    if (!route) return;

    event.preventDefault();
    event.stopPropagation();
    window.location.hash = route;
  }, true);
}

if (typeof document !== "undefined") {
  installCalendarViewToggleGuard();
}
