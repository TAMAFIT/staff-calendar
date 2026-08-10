import test from "node:test";
import assert from "node:assert/strict";
import {
  HistoryV2CalendarRepository,
  mergeHistoryV2
} from "../src/services/history-v2-calendar-repository.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function entry(overrides = {}) {
  return {
    historyId: "1723287000000_aaaaaaaa-bbbb-cccc-dddd-000000000001",
    mutationId: "mutation-1",
    timestamp: "2026-08-10 19:50:00",
    action: "変更",
    source: "大林",
    id: "event-1",
    customerName: "森井様",
    trainerName: "大林",
    startAt: "2026-08-17T13:00:00",
    endAt: "2026-08-17T13:30:00",
    typeName: "通常予約",
    beforeSummary: "",
    ...overrides
  };
}

function sourceWithHistory(initial) {
  return {
    history: [...initial],
    async listEvents() { return []; },
    async getEvent() { return null; },
    async listHistory() { return this.history.map((item) => ({ ...item })); },
    async deleteHistoryResult(ids) {
      const remove = new Set(ids.map(String));
      this.history = this.history.filter((item) => !remove.has(String(item.historyId)));
      return { deleted: [...ids], acknowledged: [...ids] };
    },
    async deleteHistory(ids) { return (await this.deleteHistoryResult(ids)).deleted; }
  };
}

test("legacy GAS history without mutationId still replaces the same-minute optimistic copy", () => {
  const local = entry({
    historyId: "local:mutation-1",
    mutationId: "mutation-1",
    timestamp: "2026-08-10T10:50:25.000Z",
    localOnly: true
  });
  const oldServer = entry({ mutationId: "", timestamp: "2026-08-10 19:50:00" });
  const merged = mergeHistoryV2([oldServer], [local]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].historyId, oldServer.historyId);
});

test("a deleted server history remains hidden after repository restart even if a stale server returns it again", async () => {
  const storage = new MemoryStorage();
  const stale = entry();
  const source = sourceWithHistory([stale]);
  const first = new HistoryV2CalendarRepository(source, {
    storage,
    storageKey: "history-v2-restart"
  });

  await first.refreshHistory();
  first.deleteHistoryOptimistic([stale.historyId]);
  await first.syncHistoryDeletes();
  assert.equal(first.getCachedHistory().length, 0);

  // Simulate a stale/lagging server copy appearing again after the app restarts.
  source.history = [{ ...stale }];
  const second = new HistoryV2CalendarRepository(source, {
    storage,
    storageKey: "history-v2-restart"
  });
  await second.refreshHistory();

  assert.equal(second.getCachedHistory().length, 0);
  assert.equal(second.hiddenHistoryIds.has(stale.historyId), true);
});
