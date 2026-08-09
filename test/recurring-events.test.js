import test from "node:test";
import assert from "node:assert/strict";
import {
  ResponsiveLocalFirstCalendarRepository,
  normalizeRecurringInstances
} from "../src/services/responsive-local-first-calendar-repository.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function event(startAt) {
  return {
    id: "series-123@google.com",
    customerName: "毎週予約",
    trainerId: "tamai",
    startAt,
    endAt: startAt.replace("10:00:00", "11:00:00"),
    duration: 60,
    type: "member",
    notes: "",
    status: "confirmed",
    source: "google-calendar"
  };
}

test("recurring occurrences sharing one Google iCal ID remain separate local records", () => {
  const known = new Set();
  const result = normalizeRecurringInstances([
    event("2026-08-03T10:00:00"),
    event("2026-08-10T10:00:00"),
    event("2026-08-17T10:00:00")
  ], known);

  assert.equal(result.length, 3);
  assert.equal(new Set(result.map((item) => item.id)).size, 3);
  assert.ok(result.every((item) => item.isRecurring === true));
  assert.ok(result.every((item) => item.readOnly === true));
  assert.ok(result.every((item) => item.calendarEventId === "series-123@google.com"));
  assert.ok(known.has("series-123@google.com"));
});

test("once a series is known, a one-day refresh still keeps the occurrence identity", () => {
  const known = new Set(["series-123@google.com"]);
  const [result] = normalizeRecurringInstances([
    event("2026-09-07T10:00:00")
  ], known);

  assert.equal(result.isRecurring, true);
  assert.equal(result.readOnly, true);
  assert.equal(result.calendarEventId, "series-123@google.com");
  assert.match(result.id, /^recurring:/);
  assert.match(result.id, /2026-09-07T10:00:00$/);
});

test("local-first refresh does not collapse weekly Google Calendar occurrences", async () => {
  const source = {
    async listEvents() {
      return [
        event("2026-08-03T10:00:00"),
        event("2026-08-10T10:00:00"),
        event("2026-08-17T10:00:00"),
        event("2026-08-24T10:00:00")
      ];
    },
    async getEvent() { return null; },
    async createEvent() { throw new Error("unused"); },
    async updateEvent() { throw new Error("unused"); },
    async deleteEvent() { throw new Error("unused"); },
    async listHistory() { return []; }
  };

  const repo = new ResponsiveLocalFirstCalendarRepository(source, {
    storage: memoryStorage(),
    now: () => new Date(2026, 7, 9, 12, 0, 0).getTime()
  });

  await repo.refreshEvents("2026-08-01", "2026-08-31");
  const cached = repo.getCachedEvents("2026-08-01", "2026-08-31").events;

  assert.equal(cached.length, 4);
  assert.equal(new Set(cached.map((item) => item.id)).size, 4);
  assert.ok(cached.every((item) => item.isRecurring === true));
});
