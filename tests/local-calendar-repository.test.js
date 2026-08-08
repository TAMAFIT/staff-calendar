import test from "node:test";
import assert from "node:assert/strict";

import { LocalCalendarRepository } from "../src/services/local-calendar-repository.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

function reservation(overrides = {}) {
  return {
    customerName: "テスト 太郎",
    trainerId: "tamai",
    startAt: "2026-08-11T10:00:00",
    endAt: "2026-08-11T11:00:00",
    duration: 60,
    type: "member",
    notes: "",
    ...overrides
  };
}

test("create, update and delete keep the local calendar consistent", async () => {
  const repository = new LocalCalendarRepository(new MemoryStorage());
  repository.writeAll([]);

  const created = await repository.createEvent(reservation());
  assert.ok(created.id);
  assert.equal((await repository.listEvents("2026-08-11", "2026-08-11")).length, 1);
  assert.equal((await repository.listHistory()).at(0).action, "作成");

  const updated = await repository.updateEvent(created.id, reservation({ customerName: "変更 花子" }));
  assert.equal(updated.customerName, "変更 花子");
  assert.equal((await repository.listHistory()).at(0).action, "変更");

  await repository.deleteEvent(created.id);
  assert.equal((await repository.listEvents("2026-08-11", "2026-08-11")).length, 0);
  assert.equal((await repository.listHistory()).at(0).action, "削除");
});

test("conflicts are detected only for overlapping reservations of the same trainer", async () => {
  const repository = new LocalCalendarRepository(new MemoryStorage());
  repository.writeAll([]);
  await repository.createEvent(reservation());

  assert.equal((await repository.findConflicts(reservation({
    startAt: "2026-08-11T10:30:00",
    endAt: "2026-08-11T11:30:00"
  }))).length, 1);

  assert.equal((await repository.findConflicts(reservation({
    trainerId: "obayashi",
    startAt: "2026-08-11T10:30:00",
    endAt: "2026-08-11T11:30:00"
  }))).length, 0);
});

test("a gap under 30 minutes warns but a 30-minute gap does not", async () => {
  const repository = new LocalCalendarRepository(new MemoryStorage());
  repository.writeAll([]);
  await repository.createEvent(reservation());

  assert.equal((await repository.findBufferWarnings(reservation({
    startAt: "2026-08-11T11:00:00",
    endAt: "2026-08-11T12:00:00"
  }))).length, 1);

  assert.equal((await repository.findBufferWarnings(reservation({
    startAt: "2026-08-11T11:30:00",
    endAt: "2026-08-11T12:30:00"
  }))).length, 0);

  assert.equal((await repository.findBufferWarnings(reservation({
    trainerId: "obayashi",
    startAt: "2026-08-11T11:00:00",
    endAt: "2026-08-11T12:00:00"
  }))).length, 0);

  assert.equal((await repository.findConflicts(reservation({
    trainerId: "",
    startAt: "2026-08-11T10:30:00",
    endAt: "2026-08-11T11:30:00"
  }))).length, 0);

  assert.equal((await repository.findBufferWarnings(reservation({
    trainerId: "",
    startAt: "2026-08-11T11:00:00",
    endAt: "2026-08-11T12:00:00"
  }))).length, 0);
});

