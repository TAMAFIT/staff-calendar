import {
  BOOKING_TYPES,
  CLOSING_TIME,
  DURATIONS,
  OPENING_TIME,
  TIME_STEP_MINUTES,
  TRAINERS
} from "../config.js";
import { createTimeOptions, dateTimeToParts } from "../utils/date.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { renderAppShell } from "./app-shell.js";

export function renderBookingForm({ event = null, defaultDate, defaultTrainerId = "tamai" }) {
  const isEditing = Boolean(event);
  const startParts = event ? dateTimeToParts(event.startAt) : { date: defaultDate, time: "10:00" };
  const type = event?.type || "member";
  const selectedTrainerId = event ? event.trainerId : defaultTrainerId;
  const times = createTimeOptions(OPENING_TIME, CLOSING_TIME, TIME_STEP_MINUTES);

  const content = `
    <section class="booking-form-view">
      <div class="form-heading">
        <p class="eyebrow">${isEditing ? "予約内容の変更" : "新しい予約"}</p>
        <h1>${isEditing ? "予約を編集" : "予約を追加"}</h1>
        <p>必要な内容だけ入力して、Googleカレンダーと同じ感覚で登録できます。</p>
      </div>

      <form class="booking-form" id="bookingForm" data-event-id="${escapeAttribute(event?.id || "")}">
        <div class="field field--full">
          <label for="customerName">お客様名・予定名</label>
          <input id="customerName" name="customerName" type="text" value="${escapeAttribute(event?.customerName || "")}" placeholder="例：山田 花子" autocomplete="off" required>
          <small>予約ブロック・仮予約枠・イベントでは、用途を入力してください。</small>
        </div>

        <div class="field field--full">
          <label for="trainerId">担当トレーナー</label>
          <div class="select-wrap">
            <select id="trainerId" name="trainerId">
              <option value="" ${selectedTrainerId === "" ? "selected" : ""}>指定なし（共通予定）</option>
              ${TRAINERS.map((trainer) => `<option value="${trainer.id}" ${selectedTrainerId === trainer.id ? "selected" : ""}>${escapeHtml(trainer.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingDate">予約日</label>
          <input id="bookingDate" name="date" type="date" value="${escapeAttribute(startParts.date)}" required>
        </div>

        <div class="field">
          <label for="bookingTime">開始時間</label>
          <div class="select-wrap">
            <select id="bookingTime" name="time" required>
              ${times.map((time) => `<option value="${time}" ${startParts.time === time ? "selected" : ""}>${time}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="duration">所要時間</label>
          <div class="select-wrap">
            <select id="duration" name="duration" required>
              ${DURATIONS.map((duration) => `<option value="${duration}" ${(event?.duration || 60) === duration ? "selected" : ""}>${duration}分</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="bookingType">予約種類</label>
          <div class="select-wrap">
            <select id="bookingType" name="type" required>
              ${BOOKING_TYPES.map((item) => `<option value="${item.id}" ${type === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field field--full">
          <label for="notes">メモ <span>任意</span></label>
          <textarea id="notes" name="notes" rows="3" placeholder="当日の注意点や申し送り">${escapeHtml(event?.notes || "")}</textarea>
        </div>

        <div class="form-message" id="formMessage" role="alert"></div>

        <div class="form-actions">
          ${isEditing ? `<button class="button button--danger" type="button" data-action="delete-booking" data-id="${escapeAttribute(event.id)}">予約を削除</button>` : ""}
          <button class="button button--primary ${isEditing ? "" : "button--wide"}" type="submit">予約内容を確認する</button>
        </div>
      </form>
    </section>
  `;

  return renderAppShell(content, {
    title: isEditing ? "予約を編集" : "予約を追加",
    subtitle: "スタッフカレンダー",
    backAction: "back-from-form",
    showAdd: false
  });
}
