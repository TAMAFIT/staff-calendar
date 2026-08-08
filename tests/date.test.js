import test from "node:test";
import assert from "node:assert/strict";

import {
  addMinutesToDateTime,
  formatWeekRange,
  getMonthGrid,
  parseISODate,
  toISODate
} from "../src/utils/date.js";

test("month grid always contains six full weeks starting on Sunday", () => {
  const days = getMonthGrid(new Date(2026, 7, 1));

  assert.equal(days.length, 42);
  assert.equal(days[0].getDay(), 0);
  assert.equal(days.at(-1).getDay(), 6);
  assert.equal(toISODate(days[0]), "2026-07-26");
  assert.equal(toISODate(days.at(-1)), "2026-09-05");
});

test("week range repeats the month so the end date is unambiguous", () => {
  assert.equal(formatWeekRange(parseISODate("2026-08-05")), "8/2〜8/8");
  assert.equal(formatWeekRange(parseISODate("2026-08-31")), "8/30〜9/5");
});

test("duration calculation produces the reservation end time", () => {
  assert.equal(addMinutesToDateTime("2026-08-11T19:30:00", 60), "2026-08-11T20:30:00");
});

