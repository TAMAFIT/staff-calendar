import test from "node:test";
import assert from "node:assert/strict";

import { CachedCalendarRepository } from "../src/services/cached-calendar-repository.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

function event(id, date) {
  return { id, customerName: id, trainerId: "tamai", startAt: `${date}T10:00:00`, endAt: `${date}T11:00:00` };
}

test("a cached month range serves its contained week without another API call", async () => {
  let calls = 0;
  const source = { async listEvents() { calls += 1; return [event("a", "2026-08-03"), event("b", "2026-08-08")]; } };
  const repository = new CachedCalendarRepository(source, { storage: new MemoryStorage(), now: () => 1000 });
  await repository.refreshEvents("2026-08-01", "2026-08-31");
  const week = await repository.listEvents("2026-08-03", "2026-08-09");
  assert.equal(calls, 1);
  assert.deepEqual(week.map((item) => item.id), ["a", "b"]);
});

test("expired cached data remains available until the background refresh finishes", async () => {
  let now = 1000;
  let calls = 0;
  const source = { async listEvents() { calls += 1; return [event(String(calls), "2026-08-08")]; } };
  const repository = new CachedCalendarRepository(source, { storage: new MemoryStorage(), now: () => now, ttlMs: 20 });
  await repository.refreshEvents("2026-08-08", "2026-08-08");
  now = 1021;
  assert.equal(repository.getCachedEvents("2026-08-08", "2026-08-08").events[0].id, "1");
  assert.equal((await repository.refreshEvents("2026-08-08", "2026-08-08"))[0].id, "2");
});

test("an invalidated in-flight response cannot restore stale calendar data", async () => {
  let resolveRequest;
  const source = { listEvents: () => new Promise((resolve) => { resolveRequest = resolve; }) };
  const repository = new CachedCalendarRepository(source, { storage: new MemoryStorage() });
  const request = repository.refreshEvents("2026-08-08", "2026-08-08");
  repository.invalidate();
  resolveRequest([event("stale", "2026-08-08")]);
  await request;
  assert.equal(repository.getCachedEvents("2026-08-08", "2026-08-08"), null);
});
