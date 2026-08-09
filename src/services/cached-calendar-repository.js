import { CalendarRepository } from "./calendar-repository.js";
import { findBufferWarnings } from "./booking-proximity.js";

const CACHE_TTL_MS = 20_000;
const MAX_SNAPSHOTS = 4;

function canUseStorage(storage) {
  return storage && typeof storage.getItem === "function" && typeof storage.setItem === "function";
}

function rangeContains(snapshot, startDate, endDate) {
  return snapshot.startDate <= startDate && snapshot.endDate >= endDate;
}

function eventDate(event) {
  return String(event?.startAt || "").slice(0, 10);
}

function eventsForRange(events, startDate, endDate) {
  return events
    .filter((event) => eventDate(event) >= startDate && eventDate(event) <= endDate)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

function createMutationId(kind) {
  const random = globalThis.crypto?.randomUUID?.()
    || `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return `${kind}-${Date.now()}-${random}`;
}

function hasConflict(events, candidate, excludeId = null) {
  if (!candidate.trainerId) return [];
  return events.filter((event) => {
    if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
    return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
  });
}

// Shows the last known range immediately, then lets the UI revalidate it.
// Mutations are applied to the cache first so the UI never has to wait for Google Calendar.
export class CachedCalendarRepository extends CalendarRepository {
  constructor(source, {
    storage = globalThis.localStorage,
    storageKey = "tamafit_staff_calendar_cache_v1",
    now = () => Date.now(),
    ttlMs = CACHE_TTL_MS
  } = {}) {
    super();
    this.source = source;
    this.storage = storage;
    this.storageKey = storageKey;
    this.now = now;
    this.ttlMs = ttlMs;
    this.pendingRequests = new Map();
    this.cacheGeneration = 0;
    this.snapshots = this.readSnapshots();
  }

  readSnapshots() {
    if (!canUseStorage(this.storage)) return [];
    try {
      const saved = JSON.parse(this.storage.getItem(this.storageKey) || "[]");
      return Array.isArray(saved) ? saved.filter((snapshot) => (
        snapshot && Array.isArray(snapshot.events) && snapshot.startDate && snapshot.endDate && snapshot.fetchedAt !== undefined
      )).map((snapshot) => ({
        ...snapshot,
        // A page reload may interrupt an in-flight request. Keep showing the optimistic
        // value but force an immediate revalidation so Google remains authoritative.
        fetchedAt: snapshot.events.some((event) => event.status === "pending") ? 0 : snapshot.fetchedAt
      })) : [];
    } catch {
      return [];
    }
  }

  writeSnapshots() {
    if (!canUseStorage(this.storage)) return;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.snapshots));
    } catch {
      // The in-memory cache is still usable if the browser blocks storage.
    }
  }

  getCachedEvents(startDate, endDate) {
    const snapshot = this.snapshots
      .filter((item) => rangeContains(item, startDate, endDate))
      .sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
    if (!snapshot) return null;
    return {
      events: eventsForRange(snapshot.events, startDate, endDate),
      fetchedAt: snapshot.fetchedAt,
      isFresh: this.now() - snapshot.fetchedAt < this.ttlMs
    };
  }

  async listEvents(startDate, endDate) {
    const cached = this.getCachedEvents(startDate, endDate);
    if (cached?.isFresh) return cached.events;
    return this.refreshEvents(startDate, endDate);
  }

  async refreshEvents(startDate, endDate) {
    const requestKey = `${startDate}:${endDate}`;
    if (this.pendingRequests.has(requestKey)) return this.pendingRequests.get(requestKey);
    const generation = this.cacheGeneration;
    const request = this.source.listEvents(startDate, endDate)
      .then((events) => {
        if (generation !== this.cacheGeneration) return eventsForRange(events, startDate, endDate);
        const snapshot = {
          startDate,
          endDate,
          events: [...events].sort((a, b) => a.startAt.localeCompare(b.startAt)),
          fetchedAt: this.now()
        };
        this.snapshots = [snapshot, ...this.snapshots.filter((item) => (
          item.startDate !== startDate || item.endDate !== endDate
        ))].slice(0, MAX_SNAPSHOTS);
        this.writeSnapshots();
        return eventsForRange(snapshot.events, startDate, endDate);
      })
      .finally(() => this.pendingRequests.delete(requestKey));
    this.pendingRequests.set(requestKey, request);
    return request;
  }

  invalidate() {
    this.cacheGeneration += 1;
    this.snapshots = [];
    this.pendingRequests.clear();
    if (!canUseStorage(this.storage)) return;
    try {
      this.storage.removeItem(this.storageKey);
    } catch {
      // Nothing else is required when storage cannot be cleared.
    }
  }

  updateCachedEvents({ removeIds = [], upsertEvents = [] } = {}) {
    const idsToRemove = new Set(removeIds.filter(Boolean));
    upsertEvents.forEach((event) => {
      if (event?.id) idsToRemove.add(event.id);
    });

    let snapshots = this.snapshots.map((snapshot) => {
      const nextEvents = snapshot.events.filter((event) => !idsToRemove.has(event.id));
      upsertEvents.forEach((event) => {
        const date = eventDate(event);
        if (date && rangeContains(snapshot, date, date)) nextEvents.push(event);
      });
      return {
        ...snapshot,
        events: nextEvents.sort((a, b) => a.startAt.localeCompare(b.startAt)),
        fetchedAt: this.now()
      };
    });

    upsertEvents.forEach((event) => {
      const date = eventDate(event);
      if (!date || snapshots.some((snapshot) => rangeContains(snapshot, date, date))) return;
      snapshots.unshift({
        startDate: date,
        endDate: date,
        events: [event],
        fetchedAt: this.now()
      });
    });

    this.snapshots = snapshots.slice(0, MAX_SNAPSHOTS);
    this.writeSnapshots();
  }

  async getEvent(id) {
    const cached = this.snapshots.flatMap((snapshot) => snapshot.events).find((event) => event.id === id);
    return cached || this.source.getEvent(id);
  }

  async createEvent(input) {
    const event = await this.source.createEvent(input);
    this.updateCachedEvents({ upsertEvents: [event] });
    return event;
  }

  async updateEvent(id, input) {
    const event = await this.source.updateEvent(id, input);
    this.updateCachedEvents({ removeIds: [id], upsertEvents: [event] });
    return event;
  }

  async deleteEvent(id) {
    await this.source.deleteEvent(id);
    this.updateCachedEvents({ removeIds: [id] });
  }

  analyzeCachedBooking(candidate, excludeId = null) {
    const date = candidate.startAt.slice(0, 10);
    const cached = this.getCachedEvents(date, date);
    if (!cached) return null;
    return {
      conflicts: hasConflict(cached.events, candidate, excludeId),
      bufferWarnings: findBufferWarnings(cached.events, candidate, excludeId),
      events: cached.events,
      isFresh: cached.isFresh
    };
  }

  async analyzeBooking(candidate, excludeId = null) {
    const cachedAnalysis = this.analyzeCachedBooking(candidate, excludeId);
    // Even a stale local copy is useful for an instant pre-flight check. The GAS endpoint
    // performs the authoritative conflict check again under a lock before writing.
    if (cachedAnalysis) return cachedAnalysis;

    const date = candidate.startAt.slice(0, 10);
    const events = await this.refreshEvents(date, date);
    return {
      conflicts: hasConflict(events, candidate, excludeId),
      bufferWarnings: findBufferWarnings(events, candidate, excludeId),
      events,
      isFresh: true
    };
  }

  async findConflicts(candidate, excludeId = null) {
    return (await this.analyzeBooking(candidate, excludeId)).conflicts;
  }

  async findBufferWarnings(candidate, excludeId = null) {
    return (await this.analyzeBooking(candidate, excludeId)).bufferWarnings;
  }

  createEventOptimistic(input) {
    const mutationId = createMutationId("create");
    const optimisticEvent = {
      id: `pending:${mutationId}`,
      ...input,
      status: "pending",
      source: "optimistic",
      isManaged: true,
      lastUpdated: this.now()
    };

    this.updateCachedEvents({ upsertEvents: [optimisticEvent] });

    const committed = this.source.createEvent(input, { mutationId })
      .then((event) => {
        this.updateCachedEvents({ removeIds: [optimisticEvent.id], upsertEvents: [event] });
        return event;
      })
      .catch((error) => {
        this.updateCachedEvents({ removeIds: [optimisticEvent.id] });
        throw error;
      });

    return { event: optimisticEvent, committed, mutationId };
  }

  async updateEventOptimistic(id, input) {
    const previous = await this.getEvent(id);
    if (!previous) throw new Error("変更する予約が見つかりませんでした。");
    const mutationId = createMutationId("update");
    const optimisticEvent = {
      ...previous,
      ...input,
      id,
      status: "pending",
      source: "optimistic",
      lastUpdated: this.now()
    };

    this.updateCachedEvents({ removeIds: [id], upsertEvents: [optimisticEvent] });

    const committed = this.source.updateEvent(id, input, { mutationId })
      .then((event) => {
        this.updateCachedEvents({ removeIds: [id], upsertEvents: [event] });
        return event;
      })
      .catch((error) => {
        this.updateCachedEvents({ removeIds: [id], upsertEvents: [previous] });
        throw error;
      });

    return { event: optimisticEvent, previous, committed, mutationId };
  }

  async deleteEventOptimistic(id) {
    const previous = await this.getEvent(id);
    if (!previous) throw new Error("削除する予約が見つかりませんでした。");
    const mutationId = createMutationId("delete");

    this.updateCachedEvents({ removeIds: [id] });

    const committed = this.source.deleteEvent(id, { mutationId })
      .then(() => previous)
      .catch((error) => {
        this.updateCachedEvents({ upsertEvents: [previous] });
        throw error;
      });

    return { event: previous, committed, mutationId };
  }

  async listHistory(limit = 50) {
    return this.source.listHistory(limit);
  }
}
