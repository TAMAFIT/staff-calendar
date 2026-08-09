import { LocalFirstCalendarRepository } from "./local-first-calendar-repository.js";
import { addMonths, getMonthGrid, parseISODate, toISODate } from "../utils/date.js";

const BROAD_PREFETCH_DAYS = 90;
const RECURRING_INSTANCE_PREFIX = "recurring:";

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
    if (this.syncing || !this.outbox.length) return;
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
  }
}
