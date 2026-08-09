import test from "node:test";
import assert from "node:assert/strict";
import { weekAnchorForMonth, weekRouteForMonthToggle } from "../src/calendar-view-toggle.js";

const now = new Date(2026, 7, 10, 3, 11, 0);

test("switching the current month to weekly view anchors on today", () => {
  const anchor = weekAnchorForMonth("2026-08", now);
  assert.equal(anchor.getFullYear(), 2026);
  assert.equal(anchor.getMonth(), 7);
  assert.equal(anchor.getDate(), 10);
  assert.equal(weekRouteForMonthToggle("#/month/2026-08", now), "#/week/2026-08-10");
});

test("switching another month to weekly view anchors on that month first day", () => {
  assert.equal(weekRouteForMonthToggle("#/month/2026-09", now), "#/week/2026-09-01");
  assert.equal(weekRouteForMonthToggle("#/month/2026-07", now), "#/week/2026-07-01");
});

test("non-month routes are ignored", () => {
  assert.equal(weekRouteForMonthToggle("#/week/2026-08-10", now), null);
  assert.equal(weekRouteForMonthToggle("#/day/2026-08-10", now), null);
});
