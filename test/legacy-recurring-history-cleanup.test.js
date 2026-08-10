import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanupLegacyRecurringHistory,
  legacyRecurringFalsePositiveIds
} from "../src/legacy-recurring-history-cleanup.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    dump(key) { return JSON.parse(values.get(key) || "null"); }
  };
}

const STORAGE_KEY = "tamafit_staff_calendar_local_first_v1";
const HISTORY_KEY = `${STORAGE_KEY}:history`;
const HIDDEN_IDS_KEY = `${STORAGE_KEY}:history-hidden-ids`;

function recurringEntry(index, date) {
  return {
    historyId: `100${index}_aaaaaaaa-bbbb-cccc-dddd-${String(index).padStart(12, "0")}`,
    timestamp: `2026-08-10 10:49:0${index}`,
    action: "変更",
    source: "Googleカレンダー直接操作",
    id: "series-id@example.com",
    customerName: "野口",
    startAt: `${date}T10:00:00`,
    endAt: `${date}T11:00:00`
  };
}

test("detects the old recurring-series false-positive burst", () => {
  const entries = [
    recurringEntry(1, "2026-09-01"),
    recurringEntry(2, "2026-09-08"),
    recurringEntry(3, "2026-09-15"),
    recurringEntry(4, "2026-09-22"),
    recurringEntry(5, "2026-09-29")
  ];

  assert.deepEqual(legacyRecurringFalsePositiveIds(entries), entries.map((entry) => entry.historyId));
});

test("does not remove an ordinary single direct edit", () => {
  const entry = recurringEntry(1, "2026-09-01");
  assert.deepEqual(legacyRecurringFalsePositiveIds([entry]), []);
});

test("does not remove app-originated changes", () => {
  const entries = [
    recurringEntry(1, "2026-09-01"),
    recurringEntry(2, "2026-09-08"),
    recurringEntry(3, "2026-09-15")
  ].map((entry) => ({ ...entry, source: "大林" }));
  assert.deepEqual(legacyRecurringFalsePositiveIds(entries), []);
});

test("cleanup removes false positives locally and tombstones server history ids", () => {
  const bogus = [
    recurringEntry(1, "2026-09-01"),
    recurringEntry(2, "2026-09-08"),
    recurringEntry(3, "2026-09-15")
  ];
  const legitimate = {
    historyId: "2000_aaaaaaaa-bbbb-cccc-dddd-999999999999",
    timestamp: "2026-08-10 11:00:00",
    action: "作成",
    source: "大林",
    id: "real-event",
    customerName: "山田",
    startAt: "2026-08-20T14:00:00",
    endAt: "2026-08-20T15:00:00"
  };
  const storage = memoryStorage({
    [HISTORY_KEY]: JSON.stringify([...bogus, legitimate]),
    [HIDDEN_IDS_KEY]: JSON.stringify(["already-hidden"])
  });

  const removed = cleanupLegacyRecurringHistory(storage);
  assert.deepEqual(removed, bogus.map((entry) => entry.historyId));
  assert.deepEqual(storage.dump(HISTORY_KEY), [legitimate]);
  assert.deepEqual(new Set(storage.dump(HIDDEN_IDS_KEY)), new Set(["already-hidden", ...removed]));
});
