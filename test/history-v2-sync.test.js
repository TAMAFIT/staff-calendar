import test from "node:test";
import assert from "node:assert/strict";
import {
  HistoryV2CalendarRepository,
  historyLegacyOperationKey,
  mergeHistoryV2
} from "../src/services/history-v2-calendar-repository.js";

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function waitTurn() {
  return new Promise((resolve) => setImmediate(resolve));
}

function event(overrides = {}) {
  return {
    id: "event-1",
    customerName: "森井様",
    trainerId: "obayashi",
    startAt: "2026-08-17T10:00:00",
    endAt: "2026-08-17T10:30:00",
    duration: 30,
    type: "member",
    notes: "",
    isRecurring: false,
    ...overrides
  };
}

function serverHistory(mutationId, overrides = {}) {
  return {
    historyId: `1723286640000_aaaaaaaa-bbbb-cccc-dddd-${String(mutationId || "x").slice(-12).padStart(12, "0")}`,
    mutationId,
    timestamp: "2026-08-10 19:44:00",
    action: "作成",
    source: "大林",
    id: "event-1",
    customerName: "森井様",
    trainerName: "大林",
    startAt: "2026-08-17T10:00:00",
    endAt: "2026-08-17T10:30:00",
    typeName: "通常予約",
    beforeSummary: "",
    ...overrides
  };
}

class Source {
  constructor() {
    this.history = [];
    this.deletedRequests = [];
    this.events = [];
  }
  async listEvents() { return this.events.map((item) => ({ ...item })); }
  async getEvent() { return null; }
  async listHistory() { return this.history.map((item) => ({ ...item })); }
  async createEventWithHistory(input, { mutationId }) {
    const created = event({ ...input, id: "event-1" });
    const history = serverHistory(mutationId, {
      id: created.id,
      customerName: created.customerName,
      startAt: created.startAt,
      endAt: created.endAt
    });
    this.history.unshift(history);
    return { event: created, history };
  }
  async updateEventWithHistory(id, input, { mutationId }) {
    const updated = event({ ...input, id });
    const history = serverHistory(mutationId, {
      action: "変更",
      id,
      customerName: updated.customerName,
      startAt: updated.startAt,
      endAt: updated.endAt
    });
    this.history.unshift(history);
    return { event: updated, history };
  }
  async deleteEventWithHistory(id, { mutationId }) {
    const history = serverHistory(mutationId, { action: "削除", id });
    this.history.unshift(history);
    return { history };
  }
  async createEvent(input, options) { return (await this.createEventWithHistory(input, options)).event; }
  async updateEvent(id, input, options) { return (await this.updateEventWithHistory(id, input, options)).event; }
  async deleteEvent(id, options) { await this.deleteEventWithHistory(id, options); }
  async deleteHistoryResult(ids) {
    this.deletedRequests.push([...ids]);
    const remove = new Set(ids.map(String));
    this.history = this.history.filter((entry) => !remove.has(String(entry.historyId)));
    return { deleted: [...ids], acknowledged: [...ids] };
  }
  async deleteHistory(ids) { return (await this.deleteHistoryResult(ids)).deleted; }
}

test("legacy operation key matches local UTC and GAS JST timestamps for the same operation", () => {
  const local = serverHistory("m1", { timestamp: "2026-08-10T10:44:20.000Z", historyId: "local:m1" });
  const remote = serverHistory("", { timestamp: "2026-08-10 19:44:00" });
  assert.equal(historyLegacyOperationKey(local), historyLegacyOperationKey(remote));
});

test("server history wins over the local optimistic copy and stays one row", () => {
  const local = serverHistory("mutation-1", { historyId: "local:mutation-1", localOnly: true });
  const remote = serverHistory("mutation-1");
  const merged = mergeHistoryV2([remote], [local]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].historyId, remote.historyId);
});

test("an optimistic create is promoted to the canonical GAS history without duplication", async () => {
  const source = new Source();
  const repository = new HistoryV2CalendarRepository(source, {
    storage: new MemoryStorage(),
    storageKey: "history-v2-create",
    now: () => Date.parse("2026-08-10T10:44:00Z")
  });

  repository.createEventOptimistic(event({ id: undefined }));
  assert.equal(repository.getCachedHistory().length, 1);
  assert.equal(repository.getCachedHistory()[0].localOnly, true);

  await waitTurn();
  await waitTurn();

  const history = repository.getCachedHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].localOnly, false);
  assert.ok(history[0].historyId && !history[0].historyId.startsWith("local:"));
  assert.ok(history[0].mutationId);
});

test("deleting optimistic history before sync prevents the canonical server copy from resurrecting", async () => {
  let releaseCreate;
  const source = new Source();
  source.createEventWithHistory = async (input, { mutationId }) => new Promise((resolve) => {
    releaseCreate = () => {
      const created = event({ ...input, id: "event-1" });
      const history = serverHistory(mutationId);
      source.history.unshift(history);
      resolve({ event: created, history });
    };
  });

  const repository = new HistoryV2CalendarRepository(source, {
    storage: new MemoryStorage(),
    storageKey: "history-v2-delete-before-sync",
    now: () => Date.parse("2026-08-10T10:44:00Z")
  });

  repository.createEventOptimistic(event({ id: undefined }));
  await Promise.resolve();
  const localHistory = repository.getCachedHistory()[0];
  repository.deleteHistoryOptimistic([localHistory.historyId]);
  assert.equal(repository.getCachedHistory().length, 0);

  releaseCreate();
  await waitTurn();
  await waitTurn();
  await repository.syncHistoryDeletes();
  await repository.refreshHistory();

  assert.equal(repository.getCachedHistory().length, 0);
  assert.equal(source.history.length, 0);
});

test("a partial delete acknowledgement leaves only the unacknowledged history queued", async () => {
  const source = new Source();
  const first = serverHistory("m1");
  const second = serverHistory("m2", { historyId: "1723286641000_bbbbbbbb-bbbb-cccc-dddd-000000000002" });
  source.history = [first, second];
  source.deleteHistoryResult = async (ids) => ({ deleted: [ids[0]], acknowledged: [ids[0]] });

  const repository = new HistoryV2CalendarRepository(source, {
    storage: new MemoryStorage(),
    storageKey: "history-v2-partial"
  });
  await repository.refreshHistory();
  repository.deleteHistoryOptimistic([first.historyId, second.historyId]);
  await repository.syncHistoryDeletes();

  assert.equal(repository.pendingHistoryDeleteIds.has(first.historyId), false);
  assert.equal(repository.pendingHistoryDeleteIds.has(second.historyId), true);
});

test("a single stale direct-change audit is removed once its event is known to be recurring", async () => {
  const source = new Source();
  const recurringId = "series-id@example.com";
  source.events = [event({ id: recurringId, isRecurring: true, startAt: "2026-09-01T10:00:00", endAt: "2026-09-01T11:00:00" })];
  const bogus = serverHistory("", {
    historyId: "1723286642000_cccccccc-bbbb-cccc-dddd-000000000003",
    source: "Googleカレンダー直接操作",
    action: "変更",
    id: recurringId,
    customerName: "野口",
    startAt: "2026-09-01T10:00:00",
    endAt: "2026-09-01T11:00:00"
  });
  source.history = [bogus];

  const repository = new HistoryV2CalendarRepository(source, {
    storage: new MemoryStorage(),
    storageKey: "history-v2-recurring",
    now: () => Date.parse("2026-08-10T10:44:00Z")
  });

  await repository.refreshOneRange("2026-09-01", "2026-09-30");
  await repository.refreshHistory();
  assert.equal(repository.getCachedHistory().length, 0);
  assert.equal(repository.pendingHistoryDeleteIds.has(bogus.historyId), true);
});
