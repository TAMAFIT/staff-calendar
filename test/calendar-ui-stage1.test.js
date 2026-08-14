import test from "node:test";
import assert from "node:assert/strict";
import { renderRecentHistory, HISTORY_PREVIEW_LIMIT } from "../src/history-ui.js";
import { renderMonthView } from "../src/views/month-view.js";
import { renderWeekView } from "../src/views/week-view.js";
import { renderDayView } from "../src/views/day-view.js";
import { normalizeExplicitRecurringEvent } from "../src/services/google-calendar-repository.js";

function blockedEvent({ trainerId = "obayashi", id = "blocked-1" } = {}) {
  return {
    id,
    customerName: "クイック予約",
    trainerId,
    startAt: "2026-08-20T10:00:00",
    endAt: "2026-08-20T11:00:00",
    duration: 60,
    type: "blocked",
    notes: "",
    status: "confirmed",
    source: "google-calendar"
  };
}

function historyEntry(index) {
  return {
    historyId: `history-${index}`,
    timestamp: `2026-08-14T0${String(index % 9)}:00:00+09:00`,
    action: index % 3 === 0 ? "削除" : index % 3 === 1 ? "作成" : "変更",
    customerName: `予約${index}`,
    startAt: "2026-08-20T10:00:00",
    endAt: "2026-08-20T11:00:00"
  };
}

test("recent operation summary is a compact ten-row neutral log", () => {
  assert.equal(HISTORY_PREVIEW_LIMIT, 10);
  const html = renderRecentHistory(Array.from({ length: 12 }, (_, index) => historyEntry(index)));
  assert.equal((html.match(/class="recent-history__row"/g) || []).length, 10);
  assert.match(html, /最近の操作ログ/);
  assert.match(html, /履歴をすべて見る/);
  assert.match(html, /新規予約/);
  assert.match(html, /内容変更/);
  assert.match(html, /予約削除/);
  assert.doesNotMatch(html, /最新5件/);
});

test("month and week navigation name the current-month destination explicitly", () => {
  const monthHtml = renderMonthView(new Date(2026, 7, 1), [], []);
  const weekHtml = renderWeekView(new Date(2026, 7, 20), [], []);
  assert.match(monthHtml, />今月へ戻る</);
  assert.match(weekHtml, />今月へ戻る</);
  assert.doesNotMatch(monthHtml, />今日</);
  assert.doesNotMatch(weekHtml, />ホーム</);
});

test("assigned booking blocks keep trainer colors across calendar views", () => {
  const obayashi = blockedEvent({ trainerId: "obayashi" });
  assert.match(renderMonthView(new Date(2026, 7, 1), [obayashi], []), /month-event--aqua/);
  assert.match(renderWeekView(new Date(2026, 7, 20), [obayashi], []), /week-event--aqua/);
  assert.match(renderDayView(new Date(2026, 7, 20), [obayashi]), /day-event--aqua/);

  const shared = blockedEvent({ trainerId: "", id: "shared-block" });
  assert.match(renderDayView(new Date(2026, 7, 20), [shared]), /day-event--neutral/);
});

test("day cards advertise amber edit and red delete while the redundant history shortcut stays gone", () => {
  const html = renderDayView(new Date(2026, 7, 20), [blockedEvent()]);
  assert.match(html, /day-event__manage-edit">変更/);
  assert.match(html, /day-event__manage-delete">削除/);
  assert.match(html, /タップして変更または削除/);
  assert.doesNotMatch(html, /操作履歴をみる/);
  assert.doesNotMatch(html, /追加・変更・削除の記録/);
});

test("a single GAS event marked recurring is immediately read-only and instance-safe", () => {
  const normalized = normalizeExplicitRecurringEvent({
    ...blockedEvent({ trainerId: "tamai", id: "series-123@google.com" }),
    customerName: "毎週予約",
    type: "member",
    isRecurring: true
  });

  assert.equal(normalized.isRecurring, true);
  assert.equal(normalized.readOnly, true);
  assert.equal(normalized.calendarEventId, "series-123@google.com");
  assert.match(normalized.id, /^recurring:/);
  assert.match(normalized.id, /2026-08-20T10:00:00$/);
});
