import { createMockEvents } from "../data/mock-calendar.js";
import { CalendarRepository } from "./calendar-repository.js";
import { findBufferWarnings } from "./booking-proximity.js";

const STORAGE_KEY = "tamafit_staff_calendar_events_v1";
const HISTORY_STORAGE_KEY = "tamafit_staff_calendar_history_v1";

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

  readHistory() {
    try {
      const saved = JSON.parse(this.storage.getItem(HISTORY_STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  writeHistory(entries) {
    try {
      this.storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
    } catch {
      // The local preview remains usable when storage is unavailable.
    }
  }

  addHistory(action, before, after) {
    const current = after || before;
    if (!current) return;
    this.writeHistory([{
      timestamp: new Date().toISOString(),
      action,
      source: "ローカル確認",
      id: current.id,
      customerName: current.customerName,
      trainerName: current.trainerId === "tamai" ? "玉井" : current.trainerId === "obayashi" ? "大林" : "指定なし",
      startAt: current.startAt,
      endAt: current.endAt,
      typeName: ({ member: "通常予約", trial: "体験", consultation: "見学・相談", blocked: "予約ブロック", tentative: "仮予約枠", event: "イベント" })[current.type] || current.type,
      notes: current.notes || "",
      beforeSummary: before && after ? `${before.startAt}〜${before.endAt} / ${before.customerName}` : ""
    }, ...this.readHistory()]);
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
    this.addHistory("作成", null, event);
    return event;
  }

  async updateEvent(id, input) {
    const events = this.readAll();
    const index = events.findIndex((event) => event.id === id);
    if (index < 0) throw new Error("予約が見つかりませんでした。");
    const before = { ...events[index] };
    events[index] = { ...events[index], ...input, id, updatedAt: new Date().toISOString() };
    this.writeAll(events);
    this.addHistory("変更", before, events[index]);
    return events[index];
  }

  async deleteEvent(id) {
    const events = this.readAll();
    const deleted = events.find((event) => event.id === id);
    const next = events.filter((event) => event.id !== id);
    if (next.length === events.length) throw new Error("予約が見つかりませんでした。");
    this.writeAll(next);
    this.addHistory("削除", deleted, null);
  }

  async findConflicts(candidate, excludeId = null) {
    if (!candidate.trainerId) return [];
    return this.readAll().filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
    });
  }

  async findBufferWarnings(candidate, excludeId = null) {
    return findBufferWarnings(this.readAll(), candidate, excludeId);
  }

  async listHistory(limit = 50) {
    return this.readHistory().slice(0, limit);
  }

  async resetDemoData() {
    const seeded = createMockEvents();
    this.writeAll(seeded);
    return seeded;
  }
}
