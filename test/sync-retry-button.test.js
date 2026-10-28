import test from "node:test";
import assert from "node:assert/strict";
import { ResponsiveLocalFirstCalendarRepository } from "../src/services/responsive-local-first-calendar-repository.js";

const booking = {
  customerName: "Example", trainerId: "obayashi",
  startAt: "2026-11-02T10:00:00", endAt: "2026-11-02T11:00:00",
  duration: 60, type: "member", notes: ""
};
function storage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
}
function repository(source, label) {
  return new ResponsiveLocalFirstCalendarRepository(source, {
    storage: storage(), storageKey: "retry-check-" + label
  });
}
function retryableError() {
  const error = new Error("HTTP 403");
  error.retryable = true;
  return error;
}
function dispose(repo) { clearTimeout(repo.retryTimer); }

test("manual retry can send a queued create after an earlier network error", async () => {
  let creates = 0;
  const source = {
    listEvents: async () => [],
    listHistory: async () => [],
    createEvent: async (input) => {
      creates++;
      if (creates === 1) throw retryableError();
      return { ...input, id: "server-record", status: "confirmed" };
    }
  };
  const repo = repository(source, "success");
  try {
    const result = repo.createEventOptimistic(booking);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(creates, 1);
    assert.equal(repo.outbox.length, 1);
    assert.equal(repo.outbox[0].targetId, result.event.id);
    assert.equal(repo.outbox[0].attempts, 1);
    const synced = await repo.retryPendingNow();
    assert.equal(synced.status, "done");
    assert.equal(synced.remaining, 0);
    assert.equal(creates, 2);
    assert.ok(repo.records.some((event) => event.id === "server-record"));
  } finally { dispose(repo); }
});

test("manual retry blocks when Google already has a different-ID booking for the same slot", async () => {
  let creates = 0;
  let hasServerBooking = false;
  const source = {
    listEvents: async () => hasServerBooking ? [{ ...booking, id: "google-existing" }] : [],
    createEvent: async () => { creates++; throw retryableError(); }
  };
  const repo = repository(source, "collision");
  try {
    repo.createEventOptimistic(booking);
    await new Promise((resolve) => setTimeout(resolve, 25));
    hasServerBooking = true;
    const result = await repo.retryPendingNow();
    assert.equal(result.status, "review");
    assert.equal(creates, 1);
    assert.equal(result.remaining, 1);
    assert.equal(repo.outbox[0].needsReview, true);
    assert.equal(repo.outbox[0].kind, "create");
    const auto = await repo.syncNow();
    assert.equal(auto.status, "review");
    assert.equal(creates, 1);
  } finally { dispose(repo); }
});

test("automatic retry preflights an uncertain create and stops duplicate POST", async () => {
  let creates = 0;
  let serverBooking = null;
  const source = {
    listEvents: async () => serverBooking ? [serverBooking] : [],
    createEvent: async () => { creates++; throw retryableError(); }
  };
  const repo = repository(source, "auto");
  try {
    repo.createEventOptimistic(booking);
    await new Promise((resolve) => setTimeout(resolve, 25));
    serverBooking = { ...booking, id: "server-created-during-lost-response" };
    repo.outbox[0].nextAttemptAt = 0;
    const result = await repo.syncNow();
    assert.equal(result.status, "review");
    assert.equal(creates, 1);
  } finally { dispose(repo); }
});

test("manual retry never POSTs when verification GET fails", async () => {
  let creates = 0;
  const source = {
    listEvents: async () => { throw retryableError(); },
    createEvent: async () => { creates++; throw retryableError(); }
  };
  const repo = repository(source, "read-failure");
  try {
    repo.createEventOptimistic(booking);
    await new Promise((resolve) => setTimeout(resolve, 25));
    const response = await repo.retryPendingNow();
    assert.equal(response.status, "retrying");
    assert.equal(creates, 1);
    assert.equal(repo.outbox.length, 1);
  } finally { dispose(repo); }
});

test("manual retry cannot bypass a collision to drain later dependent changes", async () => {
  const source = {
    listEvents: async () => [{ ...booking, id: "google-existing" }],
    createEvent: async () => { throw retryableError(); },
    updateEvent: async () => { throw new Error("must not reach update"); }
  };
  const repo = repository(source, "dependent");
  try {
    const result = repo.createEventOptimistic(booking);
    repo.updateEventOptimistic(result.event.id, { ...booking, customerName: "Changed" });
    await new Promise((resolve) => setTimeout(resolve, 25));
    const response = await repo.retryPendingNow();
    assert.equal(response.status, "review");
    assert.equal(repo.outbox.length, 2);
  } finally { dispose(repo); }
});

test("manual retry blocks possible partial create with missing Google trainer metadata", async () => {
  let creates = 0;
  let remote = [];
  const source = {
    listEvents: async () => remote,
    createEvent: async () => { creates++; throw retryableError(); }
  };
  const repo = repository(source, "missing-metadata");
  try {
    repo.createEventOptimistic(booking);
    await new Promise((resolve) => setTimeout(resolve, 25));
    remote = [{ ...booking, id: "google-incomplete", trainerId: "" }];
    const result = await repo.retryPendingNow();
    assert.equal(result.status, "review");
    assert.equal(creates, 1);
    assert.equal(repo.outbox.length, 1);
  } finally { dispose(repo); }
});
