import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarRangeFromRequest,
  calendarRouteAnchor,
  calendarRouteLabel,
  calendarRouteRange,
  hasCachedCoverageForRoute,
  rangeMatchesCalendarRoute
} from "../src/calendar-fetch-status.js";

function memoryStorage(values = {}) {
  const data = new Map(Object.entries(values));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); }
  };
}

const COVERAGE_KEY = "tamafit_staff_calendar_local_first_v1:coverage";

test("calendar list GET requests expose their date range", () => {
  const range = calendarRangeFromRequest(
    "https://script.google.com/macros/s/example/exec?action=staffCalendarList&startDate=2026-09-01&endDate=2026-09-30",
    { method: "GET" }
  );

  assert.deepEqual(range, {
    startDate: "2026-09-01",
    endDate: "2026-09-30"
  });
});

test("broad startup prefetch and unrelated requests do not drive the indicator", () => {
  assert.equal(calendarRangeFromRequest(
    "https://script.google.com/macros/s/example/exec?action=staffCalendarList&startDate=2026-05-01&endDate=2027-02-01"
  ), null);
  assert.equal(calendarRangeFromRequest(
    "https://script.google.com/macros/s/example/exec?action=staffCalendarHistory&limit=50"
  ), null);
});

test("calendar routes map to a stable anchor date", () => {
  assert.equal(calendarRouteAnchor("#/month/2026-09"), "2026-09-01");
  assert.equal(calendarRouteAnchor("#/week/2026-09-13"), "2026-09-13");
  assert.equal(calendarRouteAnchor("#/day/2026-09-13"), "2026-09-13");
  assert.equal(calendarRouteAnchor("#/history"), "");
});

test("month routes use only the active month while week routes keep seven days", () => {
  assert.deepEqual(calendarRouteRange("#/month/2026-09"), {
    startDate: "2026-09-01",
    endDate: "2026-09-30"
  });
  assert.deepEqual(calendarRouteRange("#/week/2026-09-13"), {
    startDate: "2026-09-13",
    endDate: "2026-09-19"
  });
});

test("loading copy names the month that was already opened", () => {
  assert.equal(calendarRouteLabel("#/month/2026-09"), "9月");
  assert.equal(calendarRouteLabel("#/month/2026-12"), "12月");
  assert.equal(calendarRouteLabel("#/week/2026-09-13"), "この週");
});

test("only a request covering the whole active route is relevant", () => {
  const september = { startDate: "2026-09-01", endDate: "2026-09-30" };
  const august = { startDate: "2026-08-01", endDate: "2026-08-31" };
  const partialSeptember = { startDate: "2026-09-01", endDate: "2026-09-05" };

  assert.equal(rangeMatchesCalendarRoute(september, "#/month/2026-09"), true);
  assert.equal(rangeMatchesCalendarRoute(august, "#/month/2026-09"), false);
  assert.equal(rangeMatchesCalendarRoute(partialSeptember, "#/month/2026-09"), false);
  assert.equal(rangeMatchesCalendarRoute({ startDate: "2026-09-13", endDate: "2026-09-19" }, "#/week/2026-09-13"), true);
});

test("neighboring-month coverage does not make the active month look loaded", () => {
  const storage = memoryStorage({
    [COVERAGE_KEY]: JSON.stringify([
      { startDate: "2026-08-01", endDate: "2026-08-31", fetchedAt: 12345 }
    ])
  });

  assert.equal(hasCachedCoverageForRoute(storage, "#/month/2026-08"), true);
  assert.equal(hasCachedCoverageForRoute(storage, "#/month/2026-09"), false);
});

test("full cached month coverage suppresses the large initial loader", () => {
  const storage = memoryStorage({
    [COVERAGE_KEY]: JSON.stringify([
      { startDate: "2026-09-01", endDate: "2026-09-30", fetchedAt: 12345 }
    ])
  });

  assert.equal(hasCachedCoverageForRoute(storage, "#/month/2026-09"), true);
});

test("invalid or zero-timestamp coverage is treated as not loaded", () => {
  const zeroCoverage = memoryStorage({
    [COVERAGE_KEY]: JSON.stringify([
      { startDate: "2026-09-01", endDate: "2026-09-30", fetchedAt: 0 }
    ])
  });
  const brokenCoverage = memoryStorage({ [COVERAGE_KEY]: "not-json" });

  assert.equal(hasCachedCoverageForRoute(zeroCoverage, "#/month/2026-09"), false);
  assert.equal(hasCachedCoverageForRoute(brokenCoverage, "#/month/2026-09"), false);
});
