import test from "node:test";
import assert from "node:assert/strict";
import { routeForSwipe } from "../src/calendar-swipe.js";

test("month swipe moves forward and backward including year boundaries", () => {
  assert.equal(routeForSwipe("#/month/2026-09", 1), "#/month/2026-10");
  assert.equal(routeForSwipe("#/month/2026-01", -1), "#/month/2025-12");
  assert.equal(routeForSwipe("#/month/2026-12", 1), "#/month/2027-01");
});

test("week swipe moves exactly seven days across month boundaries", () => {
  assert.equal(routeForSwipe("#/week/2026-09-27", 1), "#/week/2026-10-04");
  assert.equal(routeForSwipe("#/week/2026-09-06", -1), "#/week/2026-08-30");
});

test("non-calendar routes are ignored", () => {
  assert.equal(routeForSwipe("#/day/2026-09-02", 1), null);
  assert.equal(routeForSwipe("#/history", -1), null);
});
