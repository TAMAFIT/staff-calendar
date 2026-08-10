import { historyActionClass, historyActionLabel, formatHistoryTimestamp } from "../history-ui.js";
import { escapeAttribute, escapeHtml } from "../utils/html.js";
import { renderAppShell } from "./app-shell.js";

function renderEntry(entry, { organizing = false } = {}) {
  const historyId = String(entry.historyId || "");
  const manageable = Boolean(historyId);
  return `
    <article class="history-entry history-entry--${historyActionClass(entry.action)}" data-history-entry="${escapeAttribute(historyId)}">
      <div class="history-entry__topline">
        <strong>${escapeHtml(historyActionLabel(entry.action))}</strong>
        <time>${escapeHtml(formatHistoryTimestamp(entry.timestamp))}</time>
      </div>
      <div class="history-entry__title-row">
        ${organizing && manageable ? `
          <label class="history-entry__select" aria-label="この履歴を選択">
            <input type="checkbox" data-history-select value="${escapeAttribute(historyId)}">
            <span aria-hidden="true"></span>
          </label>
        ` : ""}
        <div class="history-entry__title-copy">
          <h2>${escapeHtml(entry.customerName || "名称なし")}</h2>
          <p>${escapeHtml(String(entry.startAt || "").replace("T", " ").slice(0, 16))}〜${escapeHtml(String(entry.endAt || "").slice(11, 16))}</p>
        </div>
        ${!organizing && manageable ? `
          <button class="history-entry__delete" type="button" data-action="delete-history-one" data-history-id="${escapeAttribute(historyId)}">履歴を削除</button>
        ` : ""}
      </div>
      <div class="history-entry__meta">
        <span>操作：${escapeHtml(entry.source || "不明")}</span>
        <span>${escapeHtml(entry.trainerName || "指定なし")}</span>
        <span>${escapeHtml(entry.typeName || "予定")}</span>
      </div>
      ${entry.beforeSummary ? `<p class="history-entry__before">変更前：${escapeHtml(entry.beforeSummary)}</p>` : ""}
    </article>
  `;
}

export function renderHistoryView(entries, { organizing = false } = {}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const content = `
    <section class="history-view ${organizing ? "is-organizing" : ""}">
      <div class="history-heading">
        <div class="history-heading__copy">
          <p class="eyebrow">作成・変更・削除</p>
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
