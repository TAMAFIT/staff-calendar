import { escapeHtml } from "../utils/html.js";
import { renderAppShell } from "./app-shell.js";

function actionLabel(action) {
  return ({ "作成": "予約を追加", "変更": "予約を変更", "削除": "予約を削除" })[action] || action;
}

function actionClass(action) {
  return ({ "作成": "create", "変更": "update", "削除": "delete" })[action] || "other";
}

function formatTimestamp(value) {
  return String(value || "").replace("T", " ").replace(/\.\d+Z$/, "");
}

function renderEntry(entry) {
  return `
    <article class="history-entry history-entry--${actionClass(entry.action)}">
      <div class="history-entry__topline">
        <strong>${escapeHtml(actionLabel(entry.action))}</strong>
        <time>${escapeHtml(formatTimestamp(entry.timestamp))}</time>
      </div>
      <h2>${escapeHtml(entry.customerName || "名称なし")}</h2>
      <p>${escapeHtml(String(entry.startAt || "").replace("T", " ").slice(0, 16))}〜${escapeHtml(String(entry.endAt || "").slice(11, 16))}</p>
      <div class="history-entry__meta">
        <span>${escapeHtml(entry.trainerName || "指定なし")}</span>
        <span>${escapeHtml(entry.typeName || "予定")}</span>
      </div>
      ${entry.beforeSummary ? `<p class="history-entry__before">変更前：${escapeHtml(entry.beforeSummary)}</p>` : ""}
    </article>
  `;
}

export function renderHistoryView(entries) {
  const content = `
    <section class="history-view">
      <div class="history-heading">
        <p class="eyebrow">作成・変更・削除</p>
        <h1>操作履歴</h1>
        <p>最新50件を新しい順に表示します。</p>
      </div>
      <div class="history-list">
        ${entries.length ? entries.map(renderEntry).join("") : `
          <div class="empty-day">
            <span aria-hidden="true">i</span>
            <h2>操作履歴はまだありません</h2>
            <p>予約を追加・変更・削除すると、ここに記録されます。</p>
          </div>
        `}
      </div>
    </section>
  `;
  return renderAppShell(content, {
    title: "操作履歴",
    subtitle: "スタッフカレンダー",
    backAction: "back-to-calendar",
    showAdd: false
  });
}
