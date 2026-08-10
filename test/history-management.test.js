import test from "node:test";
import assert from "node:assert/strict";
import { renderRecentHistory } from "../src/history-ui.js";
import { historySemanticKey } from "../src/history-data.js";
import { ResponsiveLocalFirstCalendarRepository } from "../src/services/responsive-local-first-calendar-repository.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

function historyEntry(index, overrides = {}) {
  return {
    historyId: `${1700000000000 + index}_00000000-0000-4000-8000-00000000000${index}`,
    timestamp: `2026-08-10 15:0${index}:00`,
    action: index % 3 === 0 ? "作成" : index % 3 === 1 ? "変更" : "削除",
    source: "玉井",
    id: `event-${index}`,
    customerName: `テスト${index}`,
    trainerName: "玉井",
    startAt: `2026-08-10T1${index}:00:00`,
    endAt: `2026-08-10T1${index}:30:00`,
    typeName: "通常予約",
    beforeSummary: "",
    ...overrides
  };
}

test("recent history preview shows only the latest five compact rows", () => {
  const html = renderRecentHistory(Array.from({ length: 6 }, (_, index) => historyEntry(index)));
  assert.equal((html.match(/recent-history__row /g) || []).length, 5);
  assert.match(html, /テスト0/);
  assert.match(html, /テスト4/);
  assert.doesNotMatch(html, /テスト5/);
  assert.match(html, /もっと見る/);
});

test("history semantic key is stable across server/local ids", () => {
  const local = historyEntry(1, { historyId: "local:abc", id: "local:event" });
  const server = historyEntry(1, { historyId: "server-id", id: "google-event" });
  assert.equal(historySemanticKey(local), historySemanticKey(server));
});

test("history deletion disappears locally immediately and is removed from the server", async () => {
  const storage = new MemoryStorage();
  let serverEntries = [historyEntry(1), historyEntry(2)];
  const deleted = [];
  const source = {
    async listHistory() {
      return serverEntries.map((entry) => ({ ...entry }));
    },
    async deleteHistory(ids) {
      deleted.push(...ids);
      const remove = new Set(ids);
      serverEntries = serverEntries.filter((entry) => !remove.has(entry.historyId));
      return ids;
    }
  };

  const repository = new ResponsiveLocalFirstCalendarRepository(source, {
    storage,
    storageKey: "history-test",
    now: () => new Date("2026-08-10T06:00:00Z").getTime()
  });

  await repository.refreshHistory();
  const targetId = serverEntries[0].historyId;
  const removed = repository.deleteHistoryOptimistic([targetId]);

  assert.equal(removed.length, 1);
  assert.equal(repository.getCachedHistory().some((entry) => entry.historyId === targetId), false);

  await repository.syncHistoryDeletes();
  assert.deepEqual(deleted, [targetId]);

  await repository.refreshHistory();
  assert.equal(repository.getCachedHistory().some((entry) => entry.historyId === targetId), false);
});
