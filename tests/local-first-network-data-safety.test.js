import test from "node:test";
import assert from "node:assert/strict";
import { GoogleCalendarRepository } from "../src/services/google-calendar-repository.js";
import { LocalFirstCalendarRepository } from "../src/services/local-first-calendar-repository.js";

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key)
  };
}

test("an uncertain Google 403 keeps the booking in the outbox and in device storage", async () => {
  const storage = memoryStorage();
  const source = new GoogleCalendarRepository({
    endpoint: "https://script.google.com/macros/s/test-deployment/exec",
    fetchImpl: async () => new Response("Forbidden", { status: 403 })
  });
  const repository = new LocalFirstCalendarRepository(source, { storage, storageKey: "safety-test-v1" });
  const booking = {
    customerName: "保護テスト",
    trainerId: "tamai",
    startAt: "2026-10-12T11:00:00",
    endAt: "2026-10-12T12:00:00",
    duration: 60,
    type: "member",
    notes: ""
  };
  try {
    const result = repository.createEventOptimistic(booking);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(repository.outbox.length, 1);
    assert.equal(repository.outbox[0].id, result.mutationId);
    assert.equal(repository.getCachedEvents("2026-10-12", "2026-10-12").events.length, 1);
    const durable = JSON.parse(storage.getItem("safety-test-v1:outbox"));
    assert.equal(durable.length, 1);
    assert.equal(durable[0].id, result.mutationId);
    assert.equal(JSON.parse(storage.getItem("safety-test-v1:records")).length, 1);
  } finally {
    clearTimeout(repository.retryTimer);
  }
});
