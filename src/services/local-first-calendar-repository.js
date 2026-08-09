import { CalendarRepository } from "./calendar-repository.js";
import { findBufferWarnings } from "./booking-proximity.js";
import { getOperatorProfile } from "../state.js";

const DEFAULT_TTL_MS = 30_000;
const MAX_COVERAGE = 24;
const MAX_HISTORY = 50;
const RETRY_DELAYS = [1_500, 4_000, 10_000, 30_000, 60_000];

function safeParse(storage, key, fallback) {
  try {
    const value = JSON.parse(storage?.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the in-memory copy usable when storage is blocked.
  }
}

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.()
    || `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${Date.now()}-${random}`;
}

function eventDate(event) {
  return String(event?.startAt || "").slice(0, 10);
}

function inRange(event, startDate, endDate) {
  const date = eventDate(event);
  return date >= startDate && date <= endDate;
}

function sortEvents(events) {
  return [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
}

function trainerName(id) {
  if (id === "tamai") return "玉井";
  if (id === "obayashi") return "大林";
  return "指定なし";
}

function typeName(type) {
  return ({
    member: "通常予約",
    trial: "体験",
    consultation: "見学・相談",
    blocked: "予約ブロック",
    tentative: "仮予約枠",
    event: "イベント"
  })[type] || type || "予定";
}

function hasConflict(events, candidate, excludeId = null) {
  if (!candidate.trainerId) return [];
  return events.filter((event) => {
    if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
    return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
  });
}

export class LocalFirstCalendarRepository extends CalendarRepository {
  constructor(source, {
    storage = globalThis.localStorage,
    storageKey = "tamafit_staff_calendar_local_first_v1",
    now = () => Date.now(),
    ttlMs = DEFAULT_TTL_MS
  } = {}) {
    super();
    this.source = source;
    this.storage = storage;
    this.storageKey = storageKey;
    this.now = now;
    this.ttlMs = ttlMs;
    this.recordsKey = `${storageKey}:records`;
    this.coverageKey = `${storageKey}:coverage`;
    this.outboxKey = `${storageKey}:outbox`;
    this.historyKey = `${storageKey}:history`;
    this.records = safeParse(storage, this.recordsKey, []);
    this.coverage = safeParse(storage, this.coverageKey, []);
    this.outbox = safeParse(storage, this.outboxKey, []);
    this.history = safeParse(storage, this.historyKey, []);
    this.listeners = new Set();
    this.syncing = false;
    this.retryTimer = null;
    this.refreshes = new Map();

    this.migrateLegacyCache();
    queueMicrotask(() => this.syncNow());
  }

  migrateLegacyCache() {
    if (this.records.length) return;
    const legacy = safeParse(this.storage, "tamafit_staff_calendar_google_cache_v1", []);
    if (!Array.isArray(legacy) || !legacy.length) return;
    const byId = new Map();
    legacy.forEach((snapshot) => {
      (snapshot?.events || []).forEach((event) => byId.set(event.id, event));
    });
    this.records = sortEvents([...byId.values()]);
    this.coverage = legacy
      .filter((item) => item?.startDate && item?.endDate)
      .map((item) => ({ startDate: item.startDate, endDate: item.endDate, fetchedAt: item.fetchedAt || 0 }))
      .slice(0, MAX_COVERAGE);
    this.persist();
  }

  persist() {
    safeWrite(this.storage, this.recordsKey, this.records);
    safeWrite(this.storage, this.coverageKey, this.coverage);
    safeWrite(this.storage, this.outboxKey, this.outbox);
    safeWrite(this.storage, this.historyKey, this.history.slice(0, MAX_HISTORY));
  }

  onSyncFailure(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitFailure(detail) {
    this.listeners.forEach((listener) => {
      try { listener(detail); } catch { /* listener errors must not stop sync */ }
    });
  }

  getCachedEvents(startDate, endDate) {
    const covering = this.coverage
      .filter((item) => item.startDate <= startDate && item.endDate >= endDate)
      .sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
    return {
      events: sortEvents(this.records.filter((event) => inRange(event, startDate, endDate))),
      fetchedAt: covering?.fetchedAt || 0,
      isFresh: Boolean(covering && this.now() - covering.fetchedAt < this.ttlMs)
    };
  }

  getEventCached(id) {
    return this.records.find((event) => event.id === id) || null;
  }

  getCachedHistory() {
    return this.history.slice(0, MAX_HISTORY);
  }

  async listEvents(startDate, endDate) {
    return this.getCachedEvents(startDate, endDate).events;
  }

  async getEvent(id) {
    const cached = this.getEventCached(id);
    if (cached) return cached;
    const event = await this.source.getEvent(id);
    if (event) this.upsertRecord(event);
    return event;
  }

  async refreshEvents(startDate, endDate) {
    const key = `${startDate}:${endDate}`;
    if (this.refreshes.has(key)) return this.refreshes.get(key);
    const request = this.source.listEvents(startDate, endDate)
      .then((serverEvents) => {
        const lockedIds = new Set(
          this.outbox
            .filter((op) => op.kind === "update" || op.kind === "delete")
            .map((op) => op.targetId)
        );
        const localPending = this.records.filter((event) => (
          inRange(event, startDate, endDate)
          && (event.syncState === "pending" || lockedIds.has(event.id) || String(event.id).startsWith("local:"))
        ));
        const outside = this.records.filter((event) => !inRange(event, startDate, endDate));
        const filteredServer = serverEvents.filter((event) => !lockedIds.has(event.id));
        const merged = new Map();
        [...outside, ...filteredServer, ...localPending].forEach((event) => merged.set(event.id, event));
        this.records = sortEvents([...merged.values()]);
        this.coverage = [
          { startDate, endDate, fetchedAt: this.now() },
          ...this.coverage.filter((item) => item.startDate !== startDate || item.endDate !== endDate)
        ].slice(0, MAX_COVERAGE);
        this.persist();
        return this.getCachedEvents(startDate, endDate).events;
      })
      .finally(() => this.refreshes.delete(key));
    this.refreshes.set(key, request);
    return request;
  }

  refreshHistory() {
    return this.source.listHistory(MAX_HISTORY).then((entries) => {
      const localPending = this.history.filter((entry) => entry.localOnly);
      const seen = new Set();
      this.history = [...localPending, ...entries].filter((entry) => {
        const key = `${entry.timestamp}|${entry.action}|${entry.id}|${entry.customerName}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, MAX_HISTORY);
      this.persist();
      return this.history;
    });
  }

  async listHistory(limit = MAX_HISTORY) {
    return this.history.slice(0, limit);
  }

  upsertRecord(event, removeId = "") {
    const remove = new Set([removeId, event?.id].filter(Boolean));
    this.records = sortEvents([
      ...this.records.filter((item) => !remove.has(item.id)),
      ...(event ? [event] : [])
    ]);
    this.persist();
  }

  removeRecord(id) {
    this.records = this.records.filter((event) => event.id !== id);
    this.persist();
  }

  appendLocalHistory(action, before, after) {
    const current = after || before;
    if (!current) return;
    const now = new Date(this.now()).toISOString();
    this.history = [{
      timestamp: now,
      action,
      source: getOperatorProfile()?.name || "未設定端末",
      id: current.id,
      customerName: current.customerName,
      trainerName: trainerName(current.trainerId),
      startAt: current.startAt,
      endAt: current.endAt,
      typeName: typeName(current.type),
      notes: current.notes || "",
      beforeSummary: before && after ? `${before.startAt}〜${before.endAt} / ${before.customerName}` : "",
      localOnly: true
    }, ...this.history].slice(0, MAX_HISTORY);
    this.persist();
  }

  analyzeCachedBooking(candidate, excludeId = null) {
    const date = candidate.startAt.slice(0, 10);
    const events = this.getCachedEvents(date, date).events;
    return {
      conflicts: hasConflict(events, candidate, excludeId),
      bufferWarnings: findBufferWarnings(events, candidate, excludeId),
      events
    };
  }

  async analyzeBooking(candidate, excludeId = null) {
    return this.analyzeCachedBooking(candidate, excludeId);
  }

  async findConflicts(candidate, excludeId = null) {
    return this.analyzeCachedBooking(candidate, excludeId).conflicts;
  }

  async findBufferWarnings(candidate, excludeId = null) {
    return this.analyzeCachedBooking(candidate, excludeId).bufferWarnings;
  }

  createEventOptimistic(input) {
    const mutationId = makeId("create");
    const localId = `local:${mutationId}`;
    const event = {
      ...input,
      id: localId,
      status: "confirmed",
      syncState: "pending",
      source: "local-first",
      isManaged: true,
      lastUpdated: this.now()
    };
    this.upsertRecord(event);
    this.appendLocalHistory("作成", null, event);
    this.outbox.push({
      id: mutationId,
      kind: "create",
      targetId: localId,
      input,
      before: null,
      createdAt: this.now(),
      attempts: 0,
      notified: false
    });
    this.persist();
    queueMicrotask(() => this.syncNow());
    return { event, mutationId };
  }

  updateEventOptimistic(id, input) {
    const before = this.getEventCached(id);
    if (!before) throw new Error("変更する予約が見つかりませんでした。");
    const mutationId = makeId("update");
    const event = {
      ...before,
      ...input,
      id,
      status: "confirmed",
      syncState: "pending",
      source: "local-first",
      lastUpdated: this.now()
    };
    this.upsertRecord(event);
    this.appendLocalHistory("変更", before, event);
    this.outbox.push({
      id: mutationId,
      kind: "update",
      targetId: id,
      input,
      before,
      createdAt: this.now(),
      attempts: 0,
      notified: false
    });
    this.persist();
    queueMicrotask(() => this.syncNow());
    return { event, previous: before, mutationId };
  }

  deleteEventOptimistic(id) {
    const before = this.getEventCached(id);
    if (!before) throw new Error("削除する予約が見つかりませんでした。");
    const mutationId = makeId("delete");
    this.removeRecord(id);
    this.appendLocalHistory("削除", before, null);
    this.outbox.push({
      id: mutationId,
      kind: "delete",
      targetId: id,
      input: null,
      before,
      createdAt: this.now(),
      attempts: 0,
      notified: false
    });
    this.persist();
    queueMicrotask(() => this.syncNow());
    return { event: before, mutationId };
  }

  async createEvent(input) {
    return this.createEventOptimistic(input).event;
  }

  async updateEvent(id, input) {
    return this.updateEventOptimistic(id, input).event;
  }

  async deleteEvent(id) {
    this.deleteEventOptimistic(id);
  }

  rewriteTargetId(oldId, newId) {
    this.outbox.forEach((op) => {
      if (op.targetId === oldId) op.targetId = newId;
      if (op.before?.id === oldId) op.before = { ...op.before, id: newId };
    });
  }

  rollback(op, error) {
    if (op.kind === "create") {
      this.removeRecord(op.targetId);
    } else if (op.before) {
      this.upsertRecord({ ...op.before, syncState: undefined });
    }
    this.outbox = this.outbox.filter((item) => item.id !== op.id);
    this.persist();
    this.emitFailure({ op, error, rolledBack: true });
  }

  scheduleRetry(op, error) {
    op.attempts = Number(op.attempts || 0) + 1;
    const index = Math.min(op.attempts - 1, RETRY_DELAYS.length - 1);
    op.nextAttemptAt = this.now() + RETRY_DELAYS[index];
    if (op.attempts >= 3 && !op.notified) {
      op.notified = true;
      this.emitFailure({ op, error, rolledBack: false, deferred: true });
    }
    this.persist();
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.syncNow(), RETRY_DELAYS[index]);
  }

  async syncOperation(op) {
    if (op.kind === "create") {
      const serverEvent = await this.source.createEvent(op.input, { mutationId: op.id });
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
      return;
    }

    if (op.kind === "update") {
      const serverEvent = await this.source.updateEvent(op.targetId, op.input, { mutationId: op.id });
      const hasLater = this.outbox.slice(1).some((item) => item.targetId === op.targetId);
      if (!hasLater) this.upsertRecord({ ...serverEvent, syncState: undefined });
      return;
    }

    if (op.kind === "delete") {
      await this.source.deleteEvent(op.targetId, { mutationId: op.id });
    }
  }

  async syncNow() {
    if (this.syncing || !this.outbox.length) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    this.syncing = true;
    clearTimeout(this.retryTimer);

    try {
      while (this.outbox.length) {
        const op = this.outbox[0];
        if (op.nextAttemptAt && op.nextAttemptAt > this.now()) {
          this.scheduleRetry(op, new Error("再試行待ち"));
          break;
        }
        try {
          await this.syncOperation(op);
          this.outbox.shift();
          this.persist();
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
  }
}
