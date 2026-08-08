import { TRAINERS } from "../config.js";
import { formatShortDay, formatWeekRange, getWeekDays, isToday, toISODate } from "../utils/date.js";
import { escapeHtml } from "../utils/html.js";
import { getBookingType } from "../data/mock-calendar.js";
import { renderAppShell } from "./app-shell.js";

function groupEvents(events) {
  return events.reduce((groups, event) => {
    const date = event.startAt.slice(0, 10);
    groups[date] ||= [];
    groups[date].push(event);
    return groups;
  }, {});
}

function renderWeekEvent(event) {
  const trainer = TRAINERS.find((item) => item.id === event.trainerId);
  const type = getBookingType(event.type);
  const color = event.type === "blocked" ? "neutral" : (event.type === "trial" ? "amber" : trainer?.color || "neutral");
  return `
    <div class="week-event week-event--${color}">
      <time>${event.startAt.slice(11, 16)}</time>
      <span class="week-event__main">
        <strong>${escapeHtml(event.type === "blocked" ? type.name : event.customerName)}</strong>
        <small>${escapeHtml(trainer?.name || "担当未定")}・${event.duration}分</small>
      </span>
    </div>
  `;
}

export function renderWeekView(anchorDate, events, { isRefreshing = false } = {}) {
  const days = getWeekDays(anchorDate);
  const grouped = groupEvents(events);
  const dayRows = days.map((date) => {
    const isoDate = toISODate(date);
    const dayEvents = grouped[isoDate] || [];
    return `
      <article class="week-day ${isToday(date) ? "is-today" : ""}">
        <button class="week-day__header" type="button" data-action="open-day" data-date="${isoDate}">
          <span>${formatShortDay(date)}</span>
          <small>${dayEvents.length ? `${dayEvents.length}件` : "予約なし"}</small>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <div class="week-day__events">
          ${dayEvents.length ? dayEvents.map(renderWeekEvent).join("") : `<p class="week-day__empty">予約はありません</p>`}
        </div>
      </article>
    `;
  }).join("");

  const content = `
    <section class="calendar-view">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-week" aria-label="前の週">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1>${formatWeekRange(anchorDate)}</h1>
          <button class="icon-button icon-button--subtle" type="button" data-action="next-week" aria-label="次の週">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button class="today-button" type="button" data-action="today">今日</button>
      </div>

      <div class="view-switch" aria-label="カレンダー表示">
        <button type="button" data-action="show-month" aria-pressed="false">月間</button>
        <button class="is-active" type="button" data-action="show-week" aria-pressed="true">週間</button>
      </div>

      <div class="week-list">${dayRows}</div>
    </section>
  `;
  return renderAppShell(content, { isRefreshing });
}
