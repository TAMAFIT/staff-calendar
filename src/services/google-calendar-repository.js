import { GOOGLE_APPS_SCRIPT_URL } from "../config.js";
import { loadOperatorId } from "../state.js";
import { CalendarRepository } from "./calendar-repository.js";
import { findBufferWarnings } from "./booking-proximity.js";

function isConfigured(url) {
  return /^https:\/\/script\.google\.com\/macros\/s\//.test(String(url || ""));
}

function ensureConfigured(url) {
  if (isConfigured(url)) return;
  throw new Error("Googleカレンダー連携のURLが未設定です。Apps Scriptをデプロイしてから src/config.js に /exec URL を設定してください。");
}

function ensureSuccess(payload) {
  if (payload?.status === "success") return payload;
  const error = new Error(payload?.message || "Googleカレンダーとの通信に失敗しました。");
  error.retryable = false;
  throw error;
}

function connectionError(message, cause, { retryable = true } = {}) {
  const error = new Error(message);
  error.retryable = retryable;
  error.cause = cause;
  return error;
}

function withMutationId(data, mutationId) {
  return mutationId ? { ...data, mutationId } : data;
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

    let response;
    try {
      response = await this.fetchImpl(url, { method: "GET", redirect: "follow" });
    } catch (error) {
      throw connectionError("Googleカレンダーに接続できませんでした。", error);
    }
    if (!response.ok) throw connectionError("Googleカレンダーに接続できませんでした。");
    return ensureSuccess(await response.json());
  }

  async post(action, data = {}, { retryOnce = Boolean(data.mutationId) } = {}) {
    ensureConfigured(this.endpoint);
    const body = JSON.stringify({ action, operatorId: loadOperatorId(), ...data });
    const attempts = retryOnce ? 2 : 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await this.fetchImpl(this.endpoint, {
          method: "POST",
          redirect: "follow",
          // Do not add a Content-Type header. This keeps the Apps Script request CORS-simple.
          body
        });
        if (!response.ok) {
          const transient = response.status === 429 || response.status >= 500;
          if (attempt + 1 < attempts && transient) continue;
          throw connectionError("Googleカレンダーに接続できませんでした。", null, { retryable: transient });
        }
        return ensureSuccess(await response.json());
      } catch (error) {
        if (error?.retryable === false) throw error;
        if (attempt + 1 < attempts) continue;
        if (error?.retryable) throw error;
        throw connectionError("Googleカレンダーに接続できませんでした。", error);
      }
    }

    throw connectionError("Googleカレンダーに接続できませんでした。");
  }

  async listEvents(startDate, endDate) {
    const response = await this.get("staffCalendarList", { startDate, endDate });
    return response.events || [];
  }

  async getEvent(id) {
    const response = await this.get("staffCalendarGet", { id });
    return response.event || null;
  }

  async createEvent(input, { mutationId = "" } = {}) {
    const response = await this.post("staffCalendarCreate", withMutationId({ event: input }, mutationId));
    return response.event;
  }

  async updateEvent(id, input, { mutationId = "" } = {}) {
    const response = await this.post("staffCalendarUpdate", withMutationId({ id, event: input }, mutationId));
    return response.event;
  }

  async deleteEvent(id, { mutationId = "" } = {}) {
    await this.post("staffCalendarDelete", withMutationId({ id }, mutationId));
  }

  async findConflicts(candidate, excludeId = null) {
    if (!candidate.trainerId) return [];
    const date = candidate.startAt.slice(0, 10);
    const events = await this.listEvents(date, date);
    return events.filter((event) => {
      if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;
      return candidate.startAt < event.endAt && candidate.endAt > event.startAt;
    });
  }

  async findBufferWarnings(candidate, excludeId = null) {
    const date = candidate.startAt.slice(0, 10);
    return findBufferWarnings(await this.listEvents(date, date), candidate, excludeId);
  }

  async listHistory(limit = 50) {
    const response = await this.get("staffCalendarHistory", { limit });
    return response.entries || [];
  }

  async deleteHistory(historyIds) {
    const response = await this.post("staffCalendarHistoryDelete", {
      historyIds: (Array.isArray(historyIds) ? historyIds : [historyIds]).map(String).filter(Boolean)
    }, { retryOnce: false });
    return response.deleted || [];
  }
}
