import { LocalFirstCalendarRepository } from "./local-first-calendar-repository.js";

export class ResponsiveLocalFirstCalendarRepository extends LocalFirstCalendarRepository {
  constructor(source, options = {}) {
    super(source, options);
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

  async refreshEvents(startDate, endDate) {
    const events = await super.refreshEvents(startDate, endDate);
    this.emitChange();
    return events;
  }

  rollback(op, error) {
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
