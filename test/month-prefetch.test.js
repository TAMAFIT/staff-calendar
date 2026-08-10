import test from "node:test";
import assert from "node:assert/strict";
import {
  ResponsiveLocalFirstCalendarRepository,
  normalizeCalendarReadRange
} from "../src/services/responsive-local-first-calendar-repository.js";
import { addMonths, toISODate } from "../src/utils/date.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function monthRange(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return [toISODate(first), toISODate(last)];
}

class Source {
  constructor() {
    this.calls = [];
    this.firstResolve = null;
  }

  listEvents(startDate, endDate) {
    this.calls.push([startDate, endDate]);
    if (this.calls.length === 1) {
      return new Promise((resolve) => { this.firstResolve = () => resolve([]); });
    }
    return Promise.resolve([]);
  }

  async getEvent() { return null; }
  async createEvent() { throw new Error("unused"); }
  async updateEvent() { throw new Error("unused"); }
  async deleteEvent() { throw new Error("unused"); }
  async listHistory() { return []; }
}

test("a 42-day month grid is normalized to that calendar month only", () => {
  assert.deepEqual(
    normalizeCalendarReadRange("2026-08-30", "2026-10-10"),
    { startDate: "2026-09-01", endDate: "2026-09-30" }
  );

  assert.deepEqual(
    normalizeCalendarReadRange("2026-09-13", "2026-09-19"),
    { startDate: "2026-09-13", endDate: "2026-09-19" }
  );
});

test("a broad startup refresh warms only current month then next month, sequentially", async () => {
  const source = new Source();
  const now = new Date(2026, 7, 9, 12, 0, 0);
  const repo = new ResponsiveLocalFirstCalendarRepository(source, {
    storage: memoryStorage(),
    now: () => now.getTime()
  });

  const refresh = repo.refreshEvents("2026-05-01", "2027-02-01");
  await Promise.resolve();
  assert.equal(source.calls.length, 1, "next month must wait for current month to finish");
  assert.deepEqual(source.calls[0], monthRange(now));

  source.firstResolve();
  await refresh;

  assert.equal(source.calls.length, 2);
  assert.deepEqual(source.calls[1], monthRange(addMonths(now, 1)));
});

test("if current-month prefetch fails, next month is still attempted", async () => {
  const now = new Date(2026, 7, 9, 12, 0, 0);
  const calls = [];
  const source = {
    async listEvents(startDate, endDate) {
      calls.push([startDate, endDate]);
      if (calls.length === 1) throw new Error("temporary network error");
      return [];
    },
    async getEvent() { return null; },
    async createEvent() { throw new Error("unused"); },
    async updateEvent() { throw new Error("unused"); },
    async deleteEvent() { throw new Error("unused"); },
    async listHistory() { return []; }
  };
  const repo = new ResponsiveLocalFirstCalendarRepository(source, {
    storage: memoryStorage(),
    now: () => now.getTime()
  });

  await repo.refreshEvents("2026-05-01", "2027-02-01");
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], monthRange(addMonths(now, 1)));
});
