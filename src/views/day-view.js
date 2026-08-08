import { TRAINERS } from "../config.js";
import { formatDayTitle, toISODate } from "../utils/date.js";
import { escapeHtml } from "../utils/html.js";
import { getBookingType } from "../data/mock-calendar.js";
import { renderAppShell } from "./app-shell.js";

function renderDayEvent(event) {
  const trainer = TRAINERS.find((item) => item.id === event.trainerId);
  const type = getBookingType(event.type);
  const isCustomerReservation = ["member", "trial", "consultation"].includes(event.type);
  const color = event.type === "blocked" ? "neutral" : (event.type === "trial" ? "amber" : trainer?.color || "neutral");
  return `
    <button class="day-event day-event--${color}" type="button" data-action="edit-booking" data-id="${event.id}">
      <span class="day-event__time">
        <strong>${event.startAt.slice(11, 16)}</strong>
        <small>${event.endAt.slice(11, 16)}</small>
      </span>
      <span class="day-event__line" aria-hidden="true"></span>
      <span class="day-event__content">
        <span class="day-event__badges">
          <small>${escapeHtml(trainer?.name || "指定なし")}</small>
          <small>${escapeHtml(type.name)}</small>
        </span>
        <strong>${escapeHtml(isCustomerReservation ? `${event.customerName} 様` : event.customerName)}</strong>
        <span>${event.duration}分${event.notes ? `・${escapeHtml(event.notes)}` : ""}</span>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  `;
}

export function renderDayView(date, events, { isRefreshing = false } = {}) {
  const content = `
    <section class="day-view">
      <div class="day-summary">
        <div>
          <p class="eyebrow">1日の予約</p>
          <h1>${formatDayTitle(date)}</h1>
        </div>
        <span class="count-badge">${events.length}件</span>
      </div>

      <div class="day-event-list">
        ${events.length ? events.map(renderDayEvent).join("") : `
          <div class="empty-day">
            <span aria-hidden="true">✓</span>
            <h2>予約はありません</h2>
            <p>この日はまだすべての時間を調整できます。</p>
          </div>
        `}
      </div>

      <button class="button button--primary button--wide day-add-button" type="button" data-action="new-booking" data-date="${toISODate(date)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        この日に予約を追加
      </button>
      <button class="history-link" type="button" data-action="open-history">
        操作履歴をみる
        <span>追加・変更・削除の記録</span>
      </button>
    </section>
  `;
  return renderAppShell(content, {
    title: "予約一覧",
    subtitle: formatDayTitle(date),
    backAction: "back-to-calendar",
    showAdd: false,
    isRefreshing
  });
}
