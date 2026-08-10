const STORAGE_KEY = "tamafit_staff_calendar_local_first_v1";
const HISTORY_KEY = `${STORAGE_KEY}:history`;
const HIDDEN_IDS_KEY = `${STORAGE_KEY}:history-hidden-ids`;
const DIRECT_SOURCE = "Googleカレンダー直接操作";

function safeParse(storage, key, fallback) {
  try {
    const value = JSON.parse(storage?.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function dateOnly(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return {
    dayNumber: Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86_400_000),
    time: `${hour}:${minute}`
  };
}

function minuteBucket(timestamp) {
  return String(timestamp || "").slice(0, 16);
}

function isLegacyCandidate(entry) {
  return (
    entry?.source === DIRECT_SOURCE
    && entry?.action === "変更"
    && entry?.historyId
    && entry?.id
    && dateOnly(entry.startAt)
  );
}

function looksWeekly(group) {
  if (group.length < 3) return false;
  const parsed = group.map((entry) => dateOnly(entry.startAt));
  if (parsed.some((item) => !item)) return false;
  const times = new Set(parsed.map((item) => item.time));
  if (times.size !== 1) return false;
  const days = [...new Set(parsed.map((item) => item.dayNumber))].sort((a, b) => a - b);
  if (days.length < 3) return false;
  return days.every((day) => (day - days[0]) % 7 === 0);
}

export function legacyRecurringFalsePositiveIds(entries) {
  const groups = new Map();
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!isLegacyCandidate(entry)) return;
    const key = [entry.id, entry.customerName || "", minuteBucket(entry.timestamp)].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  const ids = new Set();
  groups.forEach((group) => {
    if (!looksWeekly(group)) return;
    group.forEach((entry) => ids.add(String(entry.historyId)));
  });
  return [...ids];
}

export function cleanupLegacyRecurringHistory(storage = globalThis.localStorage) {
  if (!storage) return [];
  const history = safeParse(storage, HISTORY_KEY, []);
  const ids = legacyRecurringFalsePositiveIds(history);
  if (!ids.length) return [];

  const idSet = new Set(ids);
  const hiddenIds = new Set(safeParse(storage, HIDDEN_IDS_KEY, []).map(String));
  ids.forEach((id) => hiddenIds.add(id));

  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(history.filter((entry) => !idSet.has(String(entry?.historyId || "")))));
    storage.setItem(HIDDEN_IDS_KEY, JSON.stringify([...hiddenIds]));
  } catch {
    return [];
  }

  return ids;
}

if (typeof window !== "undefined") {
  cleanupLegacyRecurringHistory(window.localStorage);
}
