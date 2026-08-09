import test from "node:test";
import assert from "node:assert/strict";
import { LocalFirstCalendarRepository } from "../src/services/local-first-calendar-repository.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function reservation(overrides = {}) {
  return {
    customerName: "山田 花子",
    trainerId: "tamai",
    startAt: "2026-08-10T10:00:00",
    endAt: "2026-08-10T11:00:00",
    duration: 60,
    type: "member",
    notes: "",
    ...overrides
  };
}

function serverEvent(overrides = {}) {
  return {
    id: "google-1",
    ...reservation(),
    status: "confirmed",
    source: "google-calendar",
    isManaged: true,
    lastUpdated: 10,
    ...overrides
  };
}

class FakeSource {
  constructor() {
    this.listCalls = 0;
    this.events = [];
    this.createImpl = async (input) => serverEvent({ ...input });
    this.updateImpl = async (id, input) => serverEvent({ id, ...input });
    this.deleteImpl = async () => undefined;
  }
  async listEvents() { this.listCalls += 1; return this.events.map((event) => ({ ...event })); }
  async getEvent(id) { return this.events.find((event) => event.id === id) || null; }
  createEvent(input, options) { return this.createImpl(input, options); }
  updateEvent(id, input, options) { return this.updateImpl(id, input, options); }
  deleteEvent(id, options) { return this.deleteImpl(id, options); }
  async listHistory() { return []; }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("calendar navigation reads local data without waiting for the network", async () => {
  const source = new FakeSource();
  source.events = [serverEvent()];
  const repo = new LocalFirstCalendarRepository(source, { storage: memoryStorage() });

  assert.deepEqual(await repo.listEvents("2026-08-10", "2026-08-10"), []);
  assert.equal(source.listCalls, 0);

  await repo.refreshEvents("2026-08-10", "2026-08-10");
  assert.equal(source.listCalls, 1);
  assert.equal(repo.getCachedEvents("2026-08-10", "2026-08-10").events.length, 1);
});

test("create appears locally before Google Calendar responds", async () => {
  let resolveCreate;
  const source = new FakeSource();
  source.createImpl = (input) => new Promise((resolve) => {
    resolveCreate = () => resolve(serverEvent({ id: "google-created", ...input }));
  });
  const repo = new LocalFirstCalendarRepository(source, { storage: memoryStorage() });

  const mutation = repo.createEventOptimistic(reservation());
  const immediate = repo.getCachedEvents("2026-08-10", "2026-08-10").events;
  assert.equal(immediate.length, 1);
  assert.equal(immediate[0].customerName, "山田 花子");
  assert.match(immediate[0].id, /^local:create-/);

  await flush();
  resolveCreate();
  await flush();
  const synced = repo.getCachedEvents("2026-08-10", "2026-08-10").events;
  assert.deepEqual(synced.map((event) => event.id), ["google-created"]);
  assert.equal(repo.outbox.length, 0);
  assert.ok(mutation.mutationId);
});

test("a validation failure rolls back the local change and reports it", async () => {
  const source = new FakeSource();
  source.createImpl = async () => {
    const error = new Error("同じ担当トレーナーに重複する予約があります。");
    error.retryable = false;
    throw error;
  };
  const repo = new LocalFirstCalendarRepository(source, { storage: memoryStorage() });
  let failure = null;
  repo.onSyncFailure((detail) => { failure = detail; });

  repo.createEventOptimistic(reservation());
  assert.equal(repo.getCachedEvents("2026-08-10", "2026-08-10").events.length, 1);

  await flush();
  assert.equal(repo.getCachedEvents("2026-08-10", "2026-08-10").events.length, 0);
  assert.equal(repo.outbox.length, 0);
  assert.equal(failure?.rolledBack, true);
  assert.match(failure?.error?.message || "", /重複/);
});

test("local update is visible synchronously", async () => {
  const source = new FakeSource();
  source.events = [serverEvent()];
  const repo = new LocalFirstCalendarRepository(source, { storage: memoryStorage() });
  await repo.refreshEvents("2026-08-10", "2026-08-10");

  repo.updateEventOptimistic("google-1", reservation({
    startAt: "2026-08-10T12:00:00",
    endAt: "2026-08-10T13:00:00"
  }));
  assert.equal(repo.getEventCached("google-1").startAt, "2026-08-10T12:00:00");
});

test("local delete disappears synchronously", async () => {
  const source = new FakeSource();
  source.events = [serverEvent()];
  const repo = new LocalFirstCalendarRepository(source, { storage: memoryStorage() });
  await repo.refreshEvents("2026-08-10", "2026-08-10");

  repo.deleteEventOptimistic("google-1");
  assert.equal(repo.getCachedEvents("2026-08-10", "2026-08-10").events.length, 0);
});
