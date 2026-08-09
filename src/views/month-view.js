import { MONTH_EVENT_LIMIT, TRAINERS } from "../config.js";
import {
  WEEKDAYS_SHORT,
  formatMonthTitle,
  getMonthGrid,
  isToday,
  monthRouteValue,
  toISODate
} from "../utils/date.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { renderAppShell } from "./app-shell.js";

function groupEvents(events) {
  return events.reduce((groups, event) => {
    const date = event.startAt.slice(0, 10);
    groups[date] ||= [];
    groups[date].push(event);
    return groups;
  }, {});
}

function renderEventChip(event) {
  const trainer = TRAINERS.find((item) => item.id === event.trainerId);
  const time = event.startAt.slice(11, 16);
  const displayName = Array.from(event.customerName.split(/[ 　]/)[0]).slice(0, 2).join("");
  const color = event.type === "blocked" ? "neutral" : (event.type === "trial" ? "amber" : trainer?.color || "neutral");
  return `
    <span class="month-event month-event--${color}" title="${escapeAttribute(`${time} ${event.customerName}`)}">
      <b>${escapeHtml(time)}</b><span>${escapeHtml(displayName)}</span>
    </span>
  `;
}

export function renderMonthView(anchorDate, events) {
  const days = getMonthGrid(anchorDate);
  const eventsByDate = groupEvents(events);
  const currentMonth = anchorDate.getMonth();

  const calendarCells = days.map((date) => {
    const isoDate = toISODate(date);
    const dayEvents = eventsByDate[isoDate] || [];
    const visibleEvents = dayEvents.slice(0, MONTH_EVENT_LIMIT);
    const remaining = dayEvents.length - visibleEvents.length;
    const classes = ["month-cell"];
    if (date.getMonth() !== currentMonth) classes.push("is-outside");
    if (isToday(date)) classes.push("is-today");
    if (date.getDay() === 0) classes.push("is-sunday");
    if (date.getDay() === 6) classes.push("is-saturday");

    return `
      <button class="${classes.join(" ")}" type="button" data-action="open-day" data-date="${isoDate}" aria-label="${date.getMonth() + 1}月${date.getDate()}日、予約${dayEvents.length}件">
        <span class="month-cell__date">${date.getDate()}</span>
        <span class="month-cell__events">
          ${visibleEvents.map(renderEventChip).join("")}
          ${remaining > 0 ? `<span class="month-event-more">ほか${remaining}件</span>` : ""}
        </span>
      </button>
    `;
  }).join("");

  const content = `
    <section class="calendar-view" aria-labelledby="calendarTitle">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__month-nav">
          <button class="icon-button icon-button--subtle" type="button" data-action="previous-month" aria-label="前の月">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 id="calendarTitle">${formatMonthTitle(anchorDate)}</h1>
          <button class="icon-button icon-button--subtle" type="button" data-action="next-month" aria-label="次の月">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button class="today-button" type="button" data-action="today">今日</button>
      </div>

      <div class="view-switch" aria-label="カレンダー表示">
        <button class="is-active" type="button" data-action="show-month" aria-pressed="true">月間</button>
        <button type="button" data-action="show-week" aria-pressed="false">週間</button>
      </div>

      <div class="month-calendar" data-month="${monthRouteValue(anchorDate)}">
        <div class="weekday-row" aria-hidden="true">
          ${WEEKDAYS_SHORT.map((day, index) => `<span class="${index === 0 ? "is-sunday" : index === 6 ? "is-saturday" : ""}">${day}</span>`).join("")}
        </div>
        <div class="month-grid">${calendarCells}</div>
      </div>

      <div class="calendar-legend" aria-label="担当トレーナーの色分け">
        ${TRAINERS.map((trainer) => `<span><i class="legend-dot legend-dot--${trainer.color}"></i>${escapeHtml(trainer.name)}</span>`).join("")}
        <span><i class="legend-dot legend-dot--amber"></i>体験</span>
      </div>
      <button class="history-link" type="button" data-action="open-history">
        操作履歴をみる
        <span>追加・変更・削除の記録</span>
      </button>
    </section>
  `;

  return renderAppShell(content);
}
