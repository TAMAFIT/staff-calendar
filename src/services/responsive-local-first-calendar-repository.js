import { LocalFirstCalendarRepository } from "./local-first-calendar-repository.js";
import { addMonths, getMonthGrid, parseISODate, toISODate } from "../utils/date.js";
import { historySemanticKey } from "../history-data.js";

const BROAD_PREFETCH_DAYS = 90;
const RECURRING_INSTANCE_PREFIX = "recurring:";
const MAX_HISTORY = 50;

function rangeLengthDays(startDate, endDate) {
  return Math.round((parseISODate(endDate).getTime() - parseISODate(startDate).getTime()) / 86_400_000);
}

function monthGridRange(anchorDate) {
  const month = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const days = getMonthGrid(month);
  return {
    startDate: toISODate(days[0]),
    endDate: toISODate(days.at(-1))
  };
}

function recurringInstanceId(event) {
  return `${RECURRING_INSTANCE_PREFIX}${encodeURIComponent(event.id)}:${event.startAt}`;
}

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
    // The in-memory tombstones still keep this session consistent.
  }
}

function isLocalHistoryId(value) {
  return String(value || "").startsWith("local:") || String(value || "").startsWith("local-legacy:");
}

export function normalizeRecurringInstances(events, knownSeriesIds = new Set()) {
  const counts = new Map();
  events.forEach((event) => counts.set(event.id, (counts.get(event.id) || 0) + 1));
  counts.forEach((count, id) => {
    if (count > 1) knownSeriesIds.add(id);
  });

  return events.map((event) => {
    if (!knownSeriesIds.has(event.id)) return event;
    return {
      ...event,
      calendarEventId: event.id,
      id: recurringInstanceId(event),
      isRecurring: true,
      readOnly: true
    };
  });
}

function wrapRecurringAwareSource(source, knownSeriesIds) {
  return new Proxy(source, {
    get(target, property, receiver) {
      if (property === "listEvents") {
        return async (...args) => normalizeRecurringInstances(await target.listEvents(...args), knownSeriesIds);
      }
      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

export class ResponsiveLocalFirstCalendarRepository extends LocalFirstCalendarRepository {
  constructor(source, options = {}) {
    const knownRecurringSeriesIds = new Set();
    super(wrapRecurringAwareSource(source, knownRecurringSeriesIds), options);
    this.knownRecurringSeriesIds = knownRecurringSeriesIds;
    this.changeListeners = new Set();
    this.historyDeleteSyncing = false;
    this.historyHiddenIdsKey = `${this.storageKey}:history-hidden-ids`;
    this.historyHiddenMutationIdsKey = `${this.storageKey}:history-hidden-mutations`;
    this.historyHiddenSemanticKeysKey = `${this.storageKey}:history-hidden-semantic`;
    this.hiddenHistoryIds = readStoredSet(this.storage, this.historyHiddenIdsKey);
    this.hiddenHistoryMutationIds = readStoredSet(this.storage, this.historyHiddenMutationIdsKey);
    this.hiddenHistorySemanticKeys = readStoredSet(this.storage, this.historyHiddenSemanticKeysKey);
    this.ensureHistoryIds();
    queueMicrotask(() => this.syncHistoryDeletes());
  }

  onChange(listener) {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  emitChange() {
    this.changeListeners.forEach((listener) => {
      try { listener(); } catch { /* UI listeners must not affect synchronization */ }
    });
  }

  ensureHistoryIds() {
    let changed = false;
    this.history = this.history.map((entry, index) => {
      if (entry?.historyId) return entry;
      changed = true;
      const key = encodeURIComponent(historySemanticKey(entry)).slice(0, 180);
      return { ...entry, historyId: `local-legacy:${key}:${index}` };
    });
    if (changed) this.persist();
  }

  persistHistoryDeletionState() {
    writeStoredSet(this.storage, this.historyHiddenIdsKey, this.hiddenHistoryIds);
    writeStoredSet(this.storage, this.historyHiddenMutationIdsKey, this.hiddenHistoryMutationIds);
    writeStoredSet(this.storage, this.historyHiddenSemanticKeysKey, this.hiddenHistorySemanticKeys);
  }

  markNewestLocalHistory(mutationId) {
    const latest = this.history[0];
    if (!latest?.localOnly) return;
    this.history[0] = {
      ...latest,
      historyId: `local:${mutationId}`,
      mutationId
    };
    this.persist();
  }

  createEventOptimistic(input) {
    const result = super.createEventOptimistic(input);
    this.markNewestLocalHistory(result.mutationId);
    return result;
  }

  updateEventOptimistic(id, input) {
    const result = super.updateEventOptimistic(id, input);
    this.markNewestLocalHistory(result.mutationId);
    return result;
  }

  deleteEventOptimistic(id) {
    const result = super.deleteEventOptimistic(id);
    this.markNewestLocalHistory(result.mutationId);
    return result;
  }

  async refreshOneRange(startDate, endDate) {
    const cached = this.getCachedEvents(startDate, endDate);
    if (cached.isFresh) return cached.events;
    const events = await super.refreshEvents(startDate, endDate);
    this.emitChange();
    return events;
  }

  async prefetchCurrentAndNextMonth() {
    const now = new Date(this.now());
    const ranges = [
      monthGridRange(now),
      monthGridRange(addMonths(now, 1))
    ];

    for (const range of ranges) {
      try {
        await this.refreshOneRange(range.startDate, range.endDate);
      } catch {
        // Prefetch is best-effort. A failed month must not block the app or the next month.
      }
    }

    return this.getCachedEvents(ranges[0].startDate, ranges[1].endDate).events;
  }

  async refreshEvents(startDate, endDate) {
    // The app used to request roughly nine months at startup. That made the first
    // background read unnecessarily heavy and could leave future months looking empty.
    // Treat broad startup requests as a hint to warm only this month and next month,
    // one after the other. Any later month is fetched on demand when the user opens it.
    if (rangeLengthDays(startDate, endDate) > BROAD_PREFETCH_DAYS) {
      return this.prefetchCurrentAndNextMonth();
    }

    return this.refreshOneRange(startDate, endDate);
  }

  async refreshHistory() {
    const serverEntries = await this.source.listHistory(MAX_HISTORY);

    serverEntries.forEach((entry) => {
      const mutationMatch = entry.mutationId && this.hiddenHistoryMutationIds.has(String(entry.mutationId));
      const semantic = historySemanticKey(entry);
      const semanticMatch = this.hiddenHistorySemanticKeys.has(semantic);
      if (!mutationMatch && !semanticMatch) return;

      if (entry.historyId) this.hiddenHistoryIds.add(String(entry.historyId));
      if (mutationMatch) this.hiddenHistoryMutationIds.delete(String(entry.mutationId));
      if (semanticMatch) this.hiddenHistorySemanticKeys.delete(semantic);
    });

    const localPending = this.history.filter((entry) => {
      if (!entry.localOnly) return false;
      if (entry.historyId && this.hiddenHistoryIds.has(String(entry.historyId))) return false;
      if (entry.mutationId && this.hiddenHistoryMutationIds.has(String(entry.mutationId))) return false;
      if (this.hiddenHistorySemanticKeys.has(historySemanticKey(entry))) return false;
      return true;
    });

    const seen = new Set();
    this.history = [...serverEntries, ...localPending]
      .filter((entry) => {
        if (entry.historyId && this.hiddenHistoryIds.has(String(entry.historyId))) return false;
        if (entry.mutationId && this.hiddenHistoryMutationIds.has(String(entry.mutationId))) return false;
        if (this.hiddenHistorySemanticKeys.has(historySemanticKey(entry))) return false;

        const key = entry.mutationId
          ? `mutation:${entry.mutationId}`
          : `semantic:${historySemanticKey(entry)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_HISTORY);

    this.persist();
    this.persistHistoryDeletionState();
    this.emitChange();
    queueMicrotask(() => this.syncHistoryDeletes());
    return this.history;
  }

  deleteHistoryOptimistic(historyIds) {
    const ids = new Set((Array.isArray(historyIds) ? historyIds : [historyIds]).map(String).filter(Boolean));
    if (!ids.size) return [];

    const removed = this.history.filter((entry) => ids.has(String(entry.historyId || "")));
    removed.forEach((entry) => {
      const historyId = String(entry.historyId || "");
      if (!isLocalHistoryId(historyId)) {
        this.hiddenHistoryIds.add(historyId);
      } else if (entry.mutationId) {
        this.hiddenHistoryMutationIds.add(String(entry.mutationId));
      } else {
        this.hiddenHistorySemanticKeys.add(historySemanticKey(entry));
      }
    });

    this.history = this.history.filter((entry) => !ids.has(String(entry.historyId || "")));
    this.persist();
    this.persistHistoryDeletionState();
    this.emitChange();
    queueMicrotask(() => this.syncHistoryDeletes());
    return removed;
  }

  async syncHistoryDeletes() {
    if (this.historyDeleteSyncing || !this.hiddenHistoryIds.size) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (typeof this.source.deleteHistory !== "function") return;

    this.historyDeleteSyncing = true;
    const ids = [...this.hiddenHistoryIds];
    try {
      await this.source.deleteHistory(ids);
      ids.forEach((id) => this.hiddenHistoryIds.delete(id));
      this.persistHistoryDeletionState();
    } catch {
      // Keep tombstones and retry on the next refresh/online cycle.
    } finally {
      this.historyDeleteSyncing = false;
    }
  }

  rollback(op, error) {
    const laterForSameTarget = this.outbox.slice(1).filter((item) => item.targetId === op.targetId);

    // If a local create is rejected, every queued edit/delete that still points to
    // that temporary event is impossible too. Drop the dependency chain together.
    if (op.kind === "create" && laterForSameTarget.length) {
      const dependentIds = new Set(laterForSameTarget.map((item) => item.id));
      this.outbox = this.outbox.filter((item) => !dependentIds.has(item.id));
    }

    // A rejected update may already have been superseded by another complete update.
    // Keep the latest local state and let the later mutation become authoritative.
    if (op.kind === "update" && laterForSameTarget.length) {
      this.outbox = this.outbox.filter((item) => item.id !== op.id);
      this.persist();
      this.emitChange();
      return;
    }

    super.rollback(op, error);
    this.emitChange();
  }

  async syncNow() {
    if (this.syncing) return;
    if (!this.outbox.length) {
      this.syncHistoryDeletes();
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    this.syncing = true;
    clearTimeout(this.retryTimer);

    try {
      while (this.outbox.length) {
        const op = this.outbox[0];
        if (op.nextAttemptAt && op.nextAttemptAt > this.now()) {
          const delay = Math.max(50, op.nextAttemptAt - this.now());
          clearTimeout(this.retryTimer);
          this.retryTimer = setTimeout(() => this.syncNow(), delay);
          break;
        }

        try {
          await this.syncOperation(op);
          this.outbox.shift();
          this.persist();
          this.emitChange();
        } catch (error) {
          if (error?.retryable !== false) {
            this.scheduleRetry(op, error);
            break;
          }
          this.rollback(op, error);
        }
      }
    } finally {
      this.syncing = false;
    }

    this.syncHistoryDeletes();
    if (!this.outbox.length && (this.hiddenHistoryMutationIds.size || this.hiddenHistorySemanticKeys.size)) {
      this.refreshHistory().catch(() => {});
    }
  }
}
