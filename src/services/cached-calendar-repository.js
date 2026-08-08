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

function eventsForRange(events, startDate, endDate) {
  return events
    .filter((event) => event.startAt.slice(0, 10) >= startDate && event.startAt.slice(0, 10) <= endDate)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

// Shows the last known range immediately, then lets the UI revalidate it.
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
        snapshot && Array.isArray(snapshot.events) && snapshot.startDate && snapshot.endDate && snapshot.fetchedAt
      )) : [];
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

  async getEvent(id) {
    const cached = this.snapshots.flatMap((snapshot) => snapshot.events).find((event) => event.id === id);
    return cached || this.source.getEvent(id);
  }

  async createEvent(input) {
    const event = await this.source.createEvent(input);
    this.invalidate();
    return event;
  }

  async updateEvent(id, input) {
    const event = await this.source.updateEvent(id, input);
    this.invalidate();
    return event;
  }

  async deleteEvent(id) {
    await this.source.deleteEvent(id);
    this.invalidate();
  }

  async findConflicts(candidate, excludeId = null) {
    if (!candidate.trainerId) return [];
    const date = candidate.startAt.slice(0, 10);
    const events = await this.refreshEvents(date, date);
    return events.filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
    });
  }

  async findBufferWarnings(candidate, excludeId = null) {
    const date = candidate.startAt.slice(0, 10);
    return findBufferWarnings(await this.refreshEvents(date, date), candidate, excludeId);
  }

  async listHistory(limit = 100) {
    return this.source.listHistory(limit);
  }
}
