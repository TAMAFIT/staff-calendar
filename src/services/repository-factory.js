import { GoogleCalendarRepository } from "./google-calendar-repository.js";
import { LocalCalendarRepository } from "./local-calendar-repository.js";
import { CachedCalendarRepository } from "./cached-calendar-repository.js";
import { HistoryV2CalendarRepository } from "./history-v2-calendar-repository.js";

export function createCalendarRepository() {
  // preview.html remains a pure local mock.
  if (window.location.protocol === "file:" && !window.TAMAFIT_USE_LIVE_CALENDAR) {
    return new CachedCalendarRepository(new LocalCalendarRepository(), {
      storageKey: "tamafit_staff_calendar_mock_cache_v1"
    });
  }

  // Production stays local-first for reservations, with History V2 providing a
  // single mutationId-based ledger for local and Google-backed operation history.
  return new HistoryV2CalendarRepository(new GoogleCalendarRepository(), {
    storageKey: "tamafit_staff_calendar_local_first_v1"
  });
}
