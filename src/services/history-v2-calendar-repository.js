import { historySemanticKey } from "../history-data.js";
import { ResponsiveLocalFirstCalendarRepository } from "./responsive-local-first-calendar-repository.js";

const MAX_HISTORY = 50;
const DIRECT_SOURCE = "Googleカレンダー直接操作";

function readStoredSet(storage, key) {
  try {
    const value = JSON.parse(storage?.getItem(key) || "[]");
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeStoredSet(storage, key, set) {
  try {
    storage?.setItem(key, JSON.stringify([...set]));
  } catch {
    // Keep the in-memory state usable when persistent storage is unavailable.
  }
}

function historyMinute(value) {
  const text = String(value || "");
  if (!text) return "";
  let timestamp = NaN;
  if (/Z$/.test(text)) {
    timestamp = Date.parse(text);
  } else {
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (match) {
      timestamp = Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00+09:00`);
    }
  }
  return Number.isFinite(timestamp) ? String(Math.floor(timestamp / 60_000)) : text.slice(0, 16);
}

export function historyLegacyOperationKey(entry) {
  return [
    entry?.action || "",
    entry?.customerName || "",
    entry?.startAt || "",
    entry?.endAt || "",
    historyMinute(entry?.timestamp)
  ].join("|");
}

function historySortValue(entry) {
  const minute = historyMinute(entry?.timestamp);
  return /^\d+$/.test(minute) ? Number(minute) : 0;
}

function isServerHistory(entry) {
  const id = String(entry?.historyId || "");
  return Boolean(id && !id.startsWith("local:" ) && !id.startsWith("local-legacy:"));
}

export function mergeHistoryV2(serverEntries, localEntries, isHidden = () => false) {
  const combined = [
    ...(Array.isArray(serverEntries) ? serverEntries : []),
    ...(Array.isArray(localEntries) ? localEntries : [])
  ];
  const seenMutations = new Set();
  const seenHistoryIds = new Set();
  const seenLegacy = new Set();
  const output = [];

  combined.forEach((entry) => {
    if (!entry || isHidden(entry)) return;
    const mutationId = String(entry.mutationId || "");
    const historyId = String(entry.historyId || "");
    const legacyKey = historyLegacyOperationKey(entry);

    if (mutationId && seenMutations.has(mutationId)) return;
    if (historyId && seenHistoryIds.has(historyId)) return;
    if (legacyKey && seenLegacy.has(legacyKey)) return;

    if (mutationId) seenMutations.add(mutationId);
    if (historyId) seenHistoryIds.add(historyId);
    if (legacyKey) seenLegacy.add(legacyKey);
    output.push(entry);
  });

  return output
    .sort((a, b) => historySortValue(b) - historySortValue(a))
    .slice(0, MAX_HISTORY);
}

export class HistoryV2CalendarRepository extends ResponsiveLocalFirstCalendarRepository {
  constructor(source, options = {}) {
    super(source, options);
    this.historyPendingDeleteIdsKey = `${this.storageKey}:history-pending-delete-ids-v2`;
    this.historyHiddenLegacyKeysKey = `${this.storageKey}:history-hidden-legacy-ops-v2`;
    this.historyMigrationKey = `${this.storageKey}:history-migration-v2`;
    this.pendingHistoryDeleteIds = readStoredSet(this.storage, this.historyPendingDeleteIdsKey);
    this.hiddenHistoryLegacyKeys = readStoredSet(this.storage, this.historyHiddenLegacyKeysKey);

    // Old versions used hiddenHistoryIds as both tombstones and the pending-delete queue.
    // Seed the new explicit queue once; deleting a history ID twice is safe.
    this.hiddenHistoryIds.forEach((id) => this.pendingHistoryDeleteIds.add(id));
    this.migrateHistoryV2();
    this.persistHistoryV2State();
    queueMicrotask(() => this.syncHistoryDeletes());
  }

  persistHistoryV2State() {
    this.persistHistoryDeletionState();
    writeStoredSet(this.storage, this.historyPendingDeleteIdsKey, this.pendingHistoryDeleteIds);
    writeStoredSet(this.storage, this.historyHiddenLegacyKeysKey, this.hiddenHistoryLegacyKeys);
  }

  migrateHistoryV2() {
    if (this.storage?.getItem(this.historyMigrationKey) === "done") return;
    const serverLike = this.history.filter((entry) => isServerHistory(entry));
    const localLike = this.history.filter((entry) => !isServerHistory(entry));
    this.history = mergeHistoryV2(serverLike, localLike, (entry) => this.isHistoryHidden(entry));
    this.persist();
    try { this.storage?.setItem(this.historyMigrationKey, "done"); } catch { /* no-op */ }
  }

  isHistoryHidden(entry) {
    const historyId = String(entry?.historyId || "");
    const mutationId = String(entry?.mutationId || "");
    return Boolean(
      (historyId && this.hiddenHistoryIds.has(historyId))
      || (mutationId && this.hiddenHistoryMutationIds.has(mutationId))
      || this.hiddenHistorySemanticKeys.has(historySemanticKey(entry))
      || this.hiddenHistoryLegacyKeys.has(historyLegacyOperationKey(entry))
    );
  }

  hideHistoryEntry(entry, { queueServerDelete = true } = {}) {
    if (!entry) return;
    const historyId = String(entry.historyId || "");
    const mutationId = String(entry.mutationId || "");
    const legacyKey = historyLegacyOperationKey(entry);

    if (historyId && isServerHistory(entry)) {
      this.hiddenHistoryIds.add(historyId);
      if (queueServerDelete) this.pendingHistoryDeleteIds.add(historyId);
    }
    if (mutationId) this.hiddenHistoryMutationIds.add(mutationId);
    if (legacyKey) this.hiddenHistoryLegacyKeys.add(legacyKey);
    this.hiddenHistorySemanticKeys.add(historySemanticKey(entry));
  }

  isLegacyRecurringAudit(entry) {
    if (entry?.source !== DIRECT_SOURCE || entry?.action !== "変更") return false;
    const eventId = String(entry?.id || "");
    return Boolean(eventId && this.knownRecurringSeriesIds.has(eventId));
  }

  purgeKnownRecurringHistory() {
    let changed = false;
    this.history.forEach((entry) => {
      if (!this.isLegacyRecurringAudit(entry)) return;
      this.hideHistoryEntry(entry);
      changed = true;
    });
    if (!changed) return;
    this.history = this.history.filter((entry) => !this.isLegacyRecurringAudit(entry));
    this.persist();
    this.persistHistoryV2State();
    this.emitChange();
    queueMicrotask(() => this.syncHistoryDeletes());
  }

  async refreshOneRange(startDate, endDate) {
    const events = await super.refreshOneRange(startDate, endDate);
    let discovered = false;
    events.forEach((event) => {
      if (!event?.isRecurring) return;
      const seriesId = String(event.calendarEventId || event.id || "");
      if (!seriesId || this.knownRecurringSeriesIds.has(seriesId)) return;
      this.knownRecurringSeriesIds.add(seriesId);
      discovered = true;
    });
    if (discovered) this.purgeKnownRecurringHistory();
    return events;
  }

  async refreshHistory() {
    const serverEntries = await this.source.listHistory(MAX_HISTORY);
    const visibleServer = [];

    serverEntries.forEach((entry) => {
      if (this.isLegacyRecurringAudit(entry) || this.isHistoryHidden(entry)) {
        this.hideHistoryEntry(entry);
        return;
      }
      visibleServer.push(entry);
    });

    const localPending = this.history.filter((entry) => entry.localOnly && !this.isHistoryHidden(entry));
    this.history = mergeHistoryV2(visibleServer, localPending, (entry) => this.isHistoryHidden(entry));
    this.persist();
    this.persistHistoryV2State();
    this.emitChange();
    queueMicrotask(() => this.syncHistoryDeletes());
    return this.history;
  }

  deleteHistoryOptimistic(historyIds) {
    const ids = new Set((Array.isArray(historyIds) ? historyIds : [historyIds]).map(String).filter(Boolean));
    if (!ids.size) return [];

    const removed = this.history.filter((entry) => ids.has(String(entry.historyId || "")));
    removed.forEach((entry) => this.hideHistoryEntry(entry));
    this.history = this.history.filter((entry) => !ids.has(String(entry.historyId || "")));
    this.persist();
    this.persistHistoryV2State();
    this.emitChange();
    queueMicrotask(() => this.syncHistoryDeletes());
    return removed;
  }

  promoteMutationHistory(mutationId, serverHistory) {
    const id = String(mutationId || "");
    if (!id) return;
    const localEntry = this.history.find((entry) => String(entry.mutationId || "") === id);

    if (this.hiddenHistoryMutationIds.has(id) || (localEntry && this.isHistoryHidden(localEntry))) {
      if (serverHistory) this.hideHistoryEntry({ ...serverHistory, mutationId: serverHistory.mutationId || id });
      this.history = this.history.filter((entry) => String(entry.mutationId || "") !== id);
      this.persist();
      this.persistHistoryV2State();
      queueMicrotask(() => this.syncHistoryDeletes());
      return;
    }

    if (!serverHistory) return;
    const canonical = { ...serverHistory, mutationId: serverHistory.mutationId || id, localOnly: false };
    const legacyKey = historyLegacyOperationKey(canonical);
    this.history = this.history.filter((entry) => (
      String(entry.mutationId || "") !== id
      && historyLegacyOperationKey(entry) !== legacyKey
    ));
    this.history = mergeHistoryV2([canonical], this.history, (entry) => this.isHistoryHidden(entry));
    this.persist();
  }

  async syncHistoryDeletes() {
    if (this.historyDeleteSyncing || !this.pendingHistoryDeleteIds.size) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (typeof this.source.deleteHistory !== "function" && typeof this.source.deleteHistoryResult !== "function") return;

    this.historyDeleteSyncing = true;
    const ids = [...this.pendingHistoryDeleteIds].slice(0, MAX_HISTORY);
    try {
      let acknowledged = [];
      if (typeof this.source.deleteHistoryResult === "function") {
        const result = await this.source.deleteHistoryResult(ids);
        acknowledged = result?.acknowledged || result?.deleted || [];
      } else {
        acknowledged = await this.source.deleteHistory(ids);
      }
      acknowledged.map(String).forEach((id) => this.pendingHistoryDeleteIds.delete(id));
      this.persistHistoryV2State();
    } catch {
      // Keep the explicit pending queue and retry on refresh/online/startup.
    } finally {
      this.historyDeleteSyncing = false;
    }
  }

  async syncOperation(op) {
    if (op.kind === "create") {
      const result = typeof this.source.createEventWithHistory === "function"
        ? await this.source.createEventWithHistory(op.input, { mutationId: op.id })
        : { event: await this.source.createEvent(op.input, { mutationId: op.id }), history: null };
      const serverEvent = result.event;
      const oldId = op.targetId;
      const later = this.outbox.slice(1).filter((item) => item.targetId === oldId);
      this.rewriteTargetId(oldId, serverEvent.id);
      const current = this.getEventCached(oldId);
      this.removeRecord(oldId);
      if (!later.some((item) => item.kind === "delete")) {
        this.upsertRecord(later.length && current
          ? { ...current, id: serverEvent.id, syncState: "pending", source: "local-first" }
          : { ...serverEvent, syncState: undefined });
      }
      this.promoteMutationHistory(op.id, result.history);
      return;
    }

    if (op.kind === "update") {
      const result = typeof this.source.updateEventWithHistory === "function"
        ? await this.source.updateEventWithHistory(op.targetId, op.input, { mutationId: op.id })
        : { event: await this.source.updateEvent(op.targetId, op.input, { mutationId: op.id }), history: null };
      const hasLater = this.outbox.slice(1).some((item) => item.targetId === op.targetId);
      if (!hasLater) this.upsertRecord({ ...result.event, syncState: undefined });
      this.promoteMutationHistory(op.id, result.history);
      return;
    }

    if (op.kind === "delete") {
      const result = typeof this.source.deleteEventWithHistory === "function"
        ? await this.source.deleteEventWithHistory(op.targetId, { mutationId: op.id })
        : (await this.source.deleteEvent(op.targetId, { mutationId: op.id }), { history: null });
      this.promoteMutationHistory(op.id, result.history);
    }
  }
}
