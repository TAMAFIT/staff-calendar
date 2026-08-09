import { GoogleCalendarRepository } from "./google-calendar-repository.js";
import { LocalCalendarRepository } from "./local-calendar-repository.js";
import { CachedCalendarRepository } from "./cached-calendar-repository.js";
import { ResponsiveLocalFirstCalendarRepository } from "./responsive-local-first-calendar-repository.js";

export function createCalendarRepository() {
  // preview.html remains a pure local mock.
  if (window.location.protocol === "file:" && !window.TAMAFIT_USE_LIVE_CALENDAR) {
    return new CachedCalendarRepository(new LocalCalendarRepository(), {
      storageKey: "tamafit_staff_calendar_mock_cache_v1"
    });
  }

  // Production is local-first: the UI reads and writes the device store immediately.
  // Google Calendar is only the background synchronization target.
  return new ResponsiveLocalFirstCalendarRepository(new GoogleCalendarRepository(), {
    storageKey: "tamafit_staff_calendar_local_first_v1"
  });
}
