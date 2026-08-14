import { escapeAttribute, escapeHtml } from "./utils/html.js";

export const HISTORY_PREVIEW_LIMIT = 10;

export function historyActionLabel(action) {
  return ({
    "作成": "予約を追加",
    "変更": "予約を変更",
    "削除": "予約を削除"
  })[action] || String(action || "操作");
}

export function historyActionClass(action) {
  return ({ "作成": "create", "変更": "update", "削除": "delete" })[action] || "other";
}

function historyPreviewActionLabel(action) {
  return ({ "作成": "追加", "変更": "変更", "削除": "削除" })[action] || String(action || "操作");
}

export function historySemanticKey(entry) {
  return [
    entry?.action || "",
    entry?.customerName || "",
    entry?.startAt || "",
    entry?.endAt || "",
    entry?.beforeSummary || ""
  ].join("|");
}

export function historyEntryKey(entry) {
  if (entry?.mutationId) return `mutation:${entry.mutationId}`;
  if (entry?.historyId) return `history:${entry.historyId}`;
  return `semantic:${historySemanticKey(entry)}`;
}

function datePartsFromLocalTimestamp(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!match) return null;
  return {
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4],
    minute: match[5]
  };
}

export function formatHistoryTimestamp(value) {
  const text = String(value || "");
  if (!text) return "日時不明";

  if (/Z$/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date);
    }
  }

  const parts = datePartsFromLocalTimestamp(text);
  if (!parts) return text.slice(0, 16);
  return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatHistoryClock(value) {
  const formatted = formatHistoryTimestamp(value);
  const match = formatted.match(/(\d{1,2}:\d{2})$/);
  return match ? match[1] : formatted;
}

export function renderRecentHistory(entries, limit = HISTORY_PREVIEW_LIMIT) {
  const recent = (Array.isArray(entries) ? entries : []).slice(0, limit);
  const rows = recent.length
    ? recent.map((entry) => `
        <div class="recent-history__row recent-history__row--${historyActionClass(entry.action)}">
          <time>${escapeHtml(formatHistoryClock(entry.timestamp))}</time>
          <strong title="${escapeAttribute(entry.customerName || "名称なし")}">${escapeHtml(entry.customerName || "名称なし")}</strong>
          <span>${escapeHtml(historyPreviewActionLabel(entry.action))}</span>
        </div>
      `).join("")
    : `<p class="recent-history__empty">操作履歴はまだありません</p>`;

  return `
    <section class="recent-history" aria-label="最近の操作">
      <div class="recent-history__heading">
        <strong>最近の操作</strong>
        <span>${HISTORY_PREVIEW_LIMIT}件</span>
      </div>
      <div class="recent-history__list">${rows}</div>
      <button class="recent-history__more" type="button" data-action="open-history">
        履歴をすべて見る
        <span aria-hidden="true">›</span>
      </button>
    </section>
  `;
}
