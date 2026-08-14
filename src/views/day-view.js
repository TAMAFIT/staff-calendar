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
  const isRecurring = Boolean(event.isRecurring);
  const actionAttributes = isRecurring
    ? 'aria-disabled="true" title="繰り返し予定はGoogleカレンダーから編集してください"'
    : `data-action="edit-booking" data-id="${event.id}"`;

  return `
    <button class="day-event day-event--${color}${isRecurring ? " is-readonly" : ""}" type="button" ${actionAttributes}>
      <span class="day-event__time">
        <strong>${event.startAt.slice(11, 16)}</strong>
        <small>${event.endAt.slice(11, 16)}</small>
      </span>
      <span class="day-event__line" aria-hidden="true"></span>
      <span class="day-event__content">
        <span class="day-event__badges">
          <small>${escapeHtml(trainer?.name || "指定なし")}</small>
          <small>${escapeHtml(type.name)}</small>
          ${isRecurring ? "<small>定期</small>" : ""}
        </span>
        <strong>${escapeHtml(isCustomerReservation ? `${event.customerName} 様` : event.customerName)}</strong>
        <span>${event.duration}分${event.notes ? `・${escapeHtml(event.notes)}` : ""}</span>
      </span>
      ${isRecurring
        ? '<span class="sync-badge" aria-label="Googleカレンダーの繰り返し予定">定期</span>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'}
    </button>
  `;
}

export function renderDayView(date, events) {
  const isoDate = toISODate(date);
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

      <button class="button button--wide day-add-button day-standard-booking-button" type="button" data-action="new-booking" data-date="${isoDate}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        この日に予約を追加
      </button>
      <button class="button button--wide day-quick-booking-button" type="button" data-quick-booking data-date="${isoDate}">
        <span class="day-quick-booking-button__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M13 2 5 14h7l-1 8 8-12h-7l1-8Z"/></svg>
        </span>
        <span class="day-quick-booking-button__copy">
          <strong>クイック予約</strong>
          <small>日付と時間だけで登録</small>
        </span>
        <svg class="day-quick-booking-button__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
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
    showAdd: false
  });
}
