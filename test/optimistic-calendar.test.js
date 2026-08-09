import test from "node:test";
import assert from "node:assert/strict";
import { CachedCalendarRepository } from "../src/services/cached-calendar-repository.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function event(overrides = {}) {
  return {
    id: "event-1",
    customerName: "山田 花子",
    trainerId: "tamai",
    startAt: "2026-08-10T10:00:00",
    endAt: "2026-08-10T11:00:00",
    duration: 60,
    type: "member",
    notes: "",
    status: "confirmed",
    source: "google-calendar",
    isManaged: true,
    lastUpdated: 1,
    ...overrides
  };
}

function input(overrides = {}) {
  const value = event(overrides);
  const { id, status, source, isManaged, lastUpdated, ...reservation } = value;
  return reservation;
}

class FakeSource {
  constructor(events = []) {
    this.events = events;
    this.listCalls = 0;
    this.createImpl = async (value) => event({ id: "created-1", ...value });
    this.updateImpl = async (id, value) => event({ id, ...value });
    this.deleteImpl = async () => undefined;
  }

  async listEvents() {
    this.listCalls += 1;
    return this.events.map((item) => ({ ...item }));
  }

  async getEvent(id) {
    return this.events.find((item) => item.id === id) || null;
  }

  createEvent(value, options) {
    return this.createImpl(value, options);
  }

  updateEvent(id, value, options) {
    return this.updateImpl(id, value, options);
  }

  deleteEvent(id, options) {
    return this.deleteImpl(id, options);
  }

  async listHistory() {
    return [];
  }
}

test("booking analysis reuses cached day data instead of a second network read", async () => {
  let now = 1_000;
  const source = new FakeSource([event()]);
  const repository = new CachedCalendarRepository(source, {
    storage: memoryStorage(),
    now: () => now,
    ttlMs: 20_000
  });

  await repository.refreshEvents("2026-08-10", "2026-08-10");
  now += 60_000;

  const analysis = await repository.analyzeBooking(input({
    id: undefined,
    startAt: "2026-08-10T10:30:00",
    endAt: "2026-08-10T11:30:00"
  }));

  assert.equal(source.listCalls, 1);
  assert.equal(analysis.conflicts.length, 1);
  assert.equal(analysis.isFresh, false);
});

test("optimistic create appears immediately and is replaced by the server event", async () => {
  let resolveCreate;
  const source = new FakeSource([]);
  source.createImpl = (value) => new Promise((resolve) => {
    resolveCreate = () => resolve(event({ id: "server-created", ...value, lastUpdated: 9 }));
  });
  const repository = new CachedCalendarRepository(source, { storage: memoryStorage() });
  await repository.refreshEvents("2026-08-10", "2026-08-10");

  const mutation = repository.createEventOptimistic(input());
  const pending = repository.getCachedEvents("2026-08-10", "2026-08-10").events;
  assert.equal(pending.length, 1);
  assert.equal(pending[0].status, "pending");
  assert.match(pending[0].id, /^pending:create-/);

  resolveCreate();
  const committed = await mutation.committed;
  const saved = repository.getCachedEvents("2026-08-10", "2026-08-10").events;
  assert.equal(committed.id, "server-created");
  assert.deepEqual(saved.map((item) => item.id), ["server-created"]);
  assert.equal(saved[0].status, "confirmed");
});

test("an older in-flight refresh cannot visually overwrite an optimistic mutation", async () => {
  const original = event();
  const source = new FakeSource([original]);
  const repository = new CachedCalendarRepository(source, { storage: memoryStorage() });
  await repository.refreshEvents("2026-08-10", "2026-08-10");

  let resolveList;
  source.listEvents = () => new Promise((resolve) => {
    source.listCalls += 1;
    resolveList = resolve;
  });

  let resolveCreate;
  source.createImpl = (value) => new Promise((resolve) => {
    resolveCreate = () => resolve(event({ id: "server-created", ...value, lastUpdated: 9 }));
  });

  const refresh = repository.refreshEvents("2026-08-10", "2026-08-10");
  const mutation = repository.createEventOptimistic(input({
    customerName: "新規 予約",
    startAt: "2026-08-10T12:00:00",
    endAt: "2026-08-10T13:00:00"
  }));

  resolveList([original]);
  const rendered = await refresh;
  assert.equal(rendered.length, 2);
  assert.equal(rendered.some((item) => item.status === "pending"), true);

  resolveCreate();
  await mutation.committed;
});

test("mutating one date does not mark an unrelated stale snapshot fresh", async () => {
  let now = 1_000;
  const source = new FakeSource([event()]);
  const repository = new CachedCalendarRepository(source, {
    storage: memoryStorage(),
    now: () => now,
    ttlMs: 20_000
  });

  await repository.refreshEvents("2026-08-10", "2026-08-10");
  source.events = [event({
    id: "september-event",
    startAt: "2026-09-10T10:00:00",
    endAt: "2026-09-10T11:00:00"
  })];
  await repository.refreshEvents("2026-09-10", "2026-09-10");
  now += 60_000;

  let resolveCreate;
  source.createImpl = (value) => new Promise((resolve) => {
    resolveCreate = () => resolve(event({ id: "august-created", ...value }));
  });
  const mutation = repository.createEventOptimistic(input({
    customerName: "8月 新規",
    startAt: "2026-08-10T12:00:00",
    endAt: "2026-08-10T13:00:00"
  }));

  assert.equal(repository.getCachedEvents("2026-09-10", "2026-09-10").isFresh, false);
  resolveCreate();
  await mutation.committed;
});

test("failed optimistic create removes the temporary reservation", async () => {
  const source = new FakeSource([]);
  source.createImpl = async () => { throw new Error("重複予約"); };
  const repository = new CachedCalendarRepository(source, { storage: memoryStorage() });
  await repository.refreshEvents("2026-08-10", "2026-08-10");

  const mutation = repository.createEventOptimistic(input());
  assert.equal(repository.getCachedEvents("2026-08-10", "2026-08-10").events.length, 1);
  await assert.rejects(mutation.committed, /重複予約/);
  assert.equal(repository.getCachedEvents("2026-08-10", "2026-08-10").events.length, 0);
});

test("failed optimistic update restores the previous reservation", async () => {
  const original = event();
  const source = new FakeSource([original]);
  source.updateImpl = async () => { throw new Error("更新失敗"); };
  const repository = new CachedCalendarRepository(source, { storage: memoryStorage() });
  await repository.refreshEvents("2026-08-10", "2026-08-10");

  const mutation = await repository.updateEventOptimistic(original.id, input({
    startAt: "2026-08-10T12:00:00",
    endAt: "2026-08-10T13:00:00"
  }));
  assert.equal(repository.getCachedEvents("2026-08-10", "2026-08-10").events[0].startAt, "2026-08-10T12:00:00");

  await assert.rejects(mutation.committed, /更新失敗/);
  assert.equal(repository.getCachedEvents("2026-08-10", "2026-08-10").events[0].startAt, original.startAt);
  assert.equal(repository.getCachedEvents("2026-08-10", "2026-08-10").events[0].status, "confirmed");
});

test("failed optimistic delete restores the removed reservation", async () => {
  const original = event();
  const source = new FakeSource([original]);
  source.deleteImpl = async () => { throw new Error("削除失敗"); };
  const repository = new CachedCalendarRepository(source, { storage: memoryStorage() });
  await repository.refreshEvents("2026-08-10", "2026-08-10");

  const mutation = await repository.deleteEventOptimistic(original.id);
  assert.equal(repository.getCachedEvents("2026-08-10", "2026-08-10").events.length, 0);

  await assert.rejects(mutation.committed, /削除失敗/);
  const restored = repository.getCachedEvents("2026-08-10", "2026-08-10").events;
  assert.equal(restored.length, 1);
  assert.equal(restored[0].id, original.id);
});
