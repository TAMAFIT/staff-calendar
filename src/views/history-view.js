import { historyActionClass, historyActionLabel, formatHistoryTimestamp } from "../history-ui.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { renderAppShell } from "./app-shell.js";

function bookingRange(entry) {
  const start = String(entry.startAt || "").replace("T", " ").slice(0, 16);
  const end = String(entry.endAt || "").slice(11, 16);
  return `${start}〜${end}`;
}

function renderOrganizeEntry(entry) {
  const historyId = String(entry.historyId || "");
  const manageable = Boolean(historyId);
  return `
    <article class="history-entry history-entry--${historyActionClass(entry.action)} is-organizing-row" data-history-entry="${escapeAttribute(historyId)}">
      <label class="history-entry__organize-row">
        ${manageable ? `
          <span class="history-entry__select" aria-label="この履歴を選択">
            <input type="checkbox" data-history-select value="${escapeAttribute(historyId)}">
            <span aria-hidden="true"></span>
          </span>
        ` : '<span class="history-entry__select-placeholder" aria-hidden="true"></span>'}
        <time>${escapeHtml(formatHistoryTimestamp(entry.timestamp))}</time>
        <strong title="${escapeAttribute(entry.customerName || "名称なし")}">${escapeHtml(entry.customerName || "名称なし")}</strong>
        <span>${escapeHtml(historyActionLabel(entry.action))}</span>
      </label>
    </article>
  `;
}

function renderEntry(entry, { organizing = false } = {}) {
  if (organizing) return renderOrganizeEntry(entry);

  const historyId = String(entry.historyId || "");
  const manageable = Boolean(historyId);
  return `
    <details class="history-entry history-entry--${historyActionClass(entry.action)}" data-history-entry="${escapeAttribute(historyId)}">
      <summary class="history-entry__summary">
        <time>${escapeHtml(formatHistoryTimestamp(entry.timestamp))}</time>
        <strong title="${escapeAttribute(entry.customerName || "名称なし")}">${escapeHtml(entry.customerName || "名称なし")}</strong>
        <span>${escapeHtml(historyActionLabel(entry.action))}</span>
        <i aria-hidden="true">›</i>
      </summary>
      <div class="history-entry__details">
        <div class="history-entry__details-line">
          <span>予約</span>
          <strong>${escapeHtml(bookingRange(entry))}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>操作</span>
          <strong>${escapeHtml(entry.source || "不明")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>担当</span>
          <strong>${escapeHtml(entry.trainerName || "指定なし")}</strong>
        </div>
        <div class="history-entry__details-line">
          <span>種類</span>
          <strong>${escapeHtml(entry.typeName || "予定")}</strong>
        </div>
        ${entry.beforeSummary ? `
          <div class="history-entry__details-line history-entry__before">
            <span>変更前</span>
            <strong>${escapeHtml(entry.beforeSummary)}</strong>
          </div>
        ` : ""}
        ${manageable ? `
          <button class="history-entry__delete" type="button" data-action="delete-history-one" data-history-id="${escapeAttribute(historyId)}">この記録を削除</button>
        ` : ""}
      </div>
    </details>
  `;
}

export function renderHistoryView(entries, { organizing = false } = {}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const content = `
    <section class="history-view ${organizing ? "is-organizing" : ""}">
      <div class="history-heading">
        <div class="history-heading__copy">
          <p class="eyebrow">予約操作の記録</p>
          <h1>操作履歴</h1>
          <p>最新50件を新しい順に表示します。履歴を消しても予約自体には影響しません。</p>
        </div>
        ${safeEntries.length ? `
          <button class="history-organize-button" type="button" data-action="${organizing ? "history-organize-cancel" : "history-organize"}">
            ${organizing ? "完了" : "履歴を整理"}
          </button>
        ` : ""}
      </div>
      <div class="history-list">
        ${safeEntries.length ? safeEntries.map((entry) => renderEntry(entry, { organizing })).join("") : `
          <div class="empty-day">
            <span aria-hidden="true">i</span>
            <h2>操作履歴はまだありません</h2>
            <p>予約を追加・変更・削除すると、ここに記録されます。</p>
          </div>
        `}
      </div>
      ${organizing && safeEntries.length ? `
        <div class="history-selection-bar">
          <span><strong data-history-selected-count>0</strong>件を選択</span>
          <button type="button" data-action="delete-history-selected" disabled>選択した履歴を削除</button>
        </div>
      ` : ""}
    </section>
  `;
  return renderAppShell(content, {
    title: "操作履歴",
    subtitle: "スタッフカレンダー",
    backAction: "back-to-calendar",
    showAdd: false
  });
}
