import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarRangeFromRequest,
  calendarRouteAnchor,
  rangeMatchesCalendarRoute
} from "../src/calendar-fetch-status.js";

test("calendar list GET requests expose their date range", () => {
  const range = calendarRangeFromRequest(
    "https://script.google.com/macros/s/example/exec?action=staffCalendarList&startDate=2026-08-30&endDate=2026-10-10",
    { method: "GET" }
  );

  assert.deepEqual(range, {
    startDate: "2026-08-30",
    endDate: "2026-10-10"
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

test("only a request covering the visible calendar route is relevant", () => {
  const septemberGrid = { startDate: "2026-08-30", endDate: "2026-10-10" };
  const augustGrid = { startDate: "2026-07-26", endDate: "2026-09-05" };

  assert.equal(rangeMatchesCalendarRoute(septemberGrid, "#/month/2026-09"), true);
  assert.equal(rangeMatchesCalendarRoute(septemberGrid, "#/month/2026-08"), false);
  assert.equal(rangeMatchesCalendarRoute(augustGrid, "#/week/2026-08-30"), true);
  assert.equal(rangeMatchesCalendarRoute(augustGrid, "#/week/2026-09-13"), false);
});
