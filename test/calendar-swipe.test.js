import test from "node:test";
import assert from "node:assert/strict";
import { routeForSwipe, shouldNavigateSwipe } from "../src/calendar-swipe.js";

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

test("small horizontal drags do not change the calendar", () => {
  assert.equal(shouldNavigateSwipe({ distance: 45, width: 390, velocity: 0.2 }), false);
  assert.equal(shouldNavigateSwipe({ distance: 55, width: 390, velocity: 1.2 }), false);
});

test("a deliberate drag changes the calendar", () => {
  assert.equal(shouldNavigateSwipe({ distance: 112, width: 390, velocity: 0.2 }), true);
  assert.equal(shouldNavigateSwipe({ distance: -112, width: 390, velocity: 0.2 }), true);
});

test("a fast fling still needs meaningful travel before changing the calendar", () => {
  assert.equal(shouldNavigateSwipe({ distance: 63, width: 390, velocity: 0.9 }), true);
  assert.equal(shouldNavigateSwipe({ distance: 58, width: 390, velocity: 1.4 }), false);
});
