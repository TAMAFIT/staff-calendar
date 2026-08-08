import { GOOGLE_APPS_SCRIPT_URL } from "../config.js";
import { CalendarRepository } from "./calendar-repository.js";

function isConfigured(url) {
  return /^https:\/\/script\.google\.com\/macros\/s\//.test(String(url || ""));
}

function ensureConfigured(url) {
  if (isConfigured(url)) return;
  throw new Error("Googleカレンダー連携のURLが未設定です。Apps Scriptをデプロイしてから src/config.js に /exec URL を設定してください。");
}

function ensureSuccess(payload) {
  if (payload?.status === "success") return payload;
  throw new Error(payload?.message || "Googleカレンダーとの通信に失敗しました。");
}

export class GoogleCalendarRepository extends CalendarRepository {
  constructor({ endpoint = GOOGLE_APPS_SCRIPT_URL, fetchImpl = (...args) => globalThis.fetch(...args) } = {}) {
    super();
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
  }

  async get(action, params = {}) {
    ensureConfigured(this.endpoint);
    const url = new URL(this.endpoint);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });

    const response = await this.fetchImpl(url, { method: "GET", redirect: "follow" });
    if (!response.ok) throw new Error("Googleカレンダーに接続できませんでした。");
    return ensureSuccess(await response.json());
  }

  async post(action, data = {}) {
    ensureConfigured(this.endpoint);
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      redirect: "follow",
      // Do not add a Content-Type header. This keeps the Apps Script request CORS-simple.
      body: JSON.stringify({ action, ...data })
    });
    if (!response.ok) throw new Error("Googleカレンダーに接続できませんでした。");
    return ensureSuccess(await response.json());
  }

  async listEvents(startDate, endDate) {
    const response = await this.get("staffCalendarList", { startDate, endDate });
    return response.events || [];
  }

  async getEvent(id) {
    const response = await this.get("staffCalendarGet", { id });
    return response.event || null;
  }

  async createEvent(input) {
    const response = await this.post("staffCalendarCreate", { event: input });
    return response.event;
  }

  async updateEvent(id, input) {
    const response = await this.post("staffCalendarUpdate", { id, event: input });
    return response.event;
  }

  async deleteEvent(id) {
    await this.post("staffCalendarDelete", { id });
  }

  async findConflicts(candidate, excludeId = null) {
    const date = candidate.startAt.slice(0, 10);
    const events = await this.listEvents(date, date);
    return events.filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
    });
  }
}
