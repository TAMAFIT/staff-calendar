import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isQuickBookingHash,
  quickBookingPreset,
  quickBookingRoute
} from "../src/quick-booking.js";
import { renderDayView } from "../src/views/day-view.js";

test("quick booking keeps the regular booking button and adds a prioritized quick action", () => {
  const html = renderDayView(new Date(2026, 7, 20), []);
  assert.match(html, /data-action="new-booking"/);
  assert.match(html, /この日に予約を追加/);
  assert.match(html, /day-standard-booking-button/);
  assert.match(html, /data-quick-booking/);
  assert.match(html, /day-quick-booking-button/);
  assert.match(html, /クイック予約/);
  assert.match(html, /日付と時間だけで登録/);
});

test("trainer devices create a 60-minute trainer-assigned placeholder", () => {
  const preset = quickBookingPreset({ id: "obayashi", name: "大林", trainerId: "obayashi" });
  assert.deepEqual(preset, {
    customerName: "クイック予約",
    trainerId: "obayashi",
    duration: 60,
    type: "blocked",
    notes: "",
    operatorLabel: "大林"
  });
});

test("store or unassigned devices create a shared-store placeholder", () => {
  const store = quickBookingPreset({ id: "store", name: "店舗用端末", trainerId: "" });
  assert.equal(store.customerName, "店舗共用");
  assert.equal(store.trainerId, "");
  assert.equal(store.duration, 60);
  assert.equal(store.type, "blocked");

  const missing = quickBookingPreset(null);
  assert.equal(missing.customerName, "店舗共用");
  assert.equal(missing.trainerId, "");
});

test("quick booking route carries only the selected date plus quick mode", () => {
  const route = quickBookingRoute("2026-08-20");
  assert.equal(route, "#/booking/new?date=2026-08-20&quick=1");
  assert.equal(isQuickBookingHash(route), true);
  assert.equal(isQuickBookingHash("#/booking/new?date=2026-08-20"), false);
  assert.equal(quickBookingRoute("not-a-date"), "");
});

test("PWA shell precaches prioritized quick booking UI in a versioned cache", () => {
  const sw = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
  assert.match(sw, /tamafit-staff-calendar-v\d+/);
  assert.match(sw, /\.\/src\/quick-booking\.js/);
  assert.match(sw, /\.\/styles\/quick-booking\.css/);
});
