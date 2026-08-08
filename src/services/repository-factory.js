import { GoogleCalendarRepository } from "./google-calendar-repository.js";
import { LocalCalendarRepository } from "./local-calendar-repository.js";
import { CachedCalendarRepository } from "./cached-calendar-repository.js";

export function createCalendarRepository() {
  // preview.html is deliberately standalone, including when opened by double-click.
  // live-preview.html opts in to the actual Google Calendar while remaining serverless.
  if (window.location.protocol === "file:" && !window.TAMAFIT_USE_LIVE_CALENDAR) {
    return new CachedCalendarRepository(new LocalCalendarRepository(), {
      storageKey: "tamafit_staff_calendar_mock_cache_v1"
    });
  }
  return new CachedCalendarRepository(new GoogleCalendarRepository(), {
    storageKey: "tamafit_staff_calendar_google_cache_v1"
  });
}
