import { createMockEvents } from "../data/mock-calendar.js";
import { CalendarRepository } from "./calendar-repository.js";

const STORAGE_KEY = "tamafit_staff_calendar_events_v1";

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class LocalCalendarRepository extends CalendarRepository {
  constructor(storage = globalThis.localStorage) {
    super();
    this.storage = storage;
  }

  readAll() {
    try {
      const saved = this.storage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fall through to fresh mock data when saved data is unavailable.
    }

    const seeded = createMockEvents();
    this.writeAll(seeded);
    return seeded;
  }

  writeAll(events) {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Keep the current session usable even if storage is blocked.
    }
  }

  async listEvents(startDate, endDate) {
    return this.readAll()
      .filter((event) => event.startAt.slice(0, 10) >= startDate && event.startAt.slice(0, 10) <= endDate)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }

  async getEvent(id) {
    return this.readAll().find((event) => event.id === id) || null;
  }

  async createEvent(input) {
    const now = new Date().toISOString();
    const event = {
      ...input,
      id: makeId(),
      status: "confirmed",
      source: "staff-calendar",
      createdAt: now,
      updatedAt: now
    };
    const events = this.readAll();
    events.push(event);
    this.writeAll(events);
    return event;
  }

  async updateEvent(id, input) {
    const events = this.readAll();
    const index = events.findIndex((event) => event.id === id);
    if (index < 0) throw new Error("予約が見つかりませんでした。");
    events[index] = { ...events[index], ...input, id, updatedAt: new Date().toISOString() };
    this.writeAll(events);
    return events[index];
  }

  async deleteEvent(id) {
    const events = this.readAll();
    const next = events.filter((event) => event.id !== id);
    if (next.length === events.length) throw new Error("予約が見つかりませんでした。");
    this.writeAll(next);
  }

  async findConflicts(candidate, excludeId = null) {
    return this.readAll().filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
    });
  }

  async resetDemoData() {
    const seeded = createMockEvents();
    this.writeAll(seeded);
    return seeded;
  }
}
