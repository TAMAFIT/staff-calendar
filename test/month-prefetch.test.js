import test from "node:test";
import assert from "node:assert/strict";
import { ResponsiveLocalFirstCalendarRepository } from "../src/services/responsive-local-first-calendar-repository.js";
import { addMonths, getMonthGrid, toISODate } from "../src/utils/date.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function monthRange(date) {
  const days = getMonthGrid(new Date(date.getFullYear(), date.getMonth(), 1));
  return [toISODate(days[0]), toISODate(days.at(-1))];
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
