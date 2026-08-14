import { getOperatorProfile } from "./state.js";

export const QUICK_BOOKING_DURATION = 60;
const QUICK_BOOKING_TYPE = "blocked";
const QUICK_BOOKING_NAME = "クイック予約";
const STORE_SHARED_NAME = "店舗共用";

export function isQuickBookingHash(hash) {
  const value = String(hash || "");
  return /^#\/booking\/new\?/.test(value) && /(?:^|[?&])quick=1(?:&|$)/.test(value);
}

export function quickBookingRoute(date) {
  const value = String(date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return `#/booking/new?date=${value}&quick=1`;
}

export function quickBookingPreset(operator) {
  const trainerId = String(operator?.trainerId || "");
  return {
    customerName: trainerId ? QUICK_BOOKING_NAME : STORE_SHARED_NAME,
    trainerId,
    duration: QUICK_BOOKING_DURATION,
    type: QUICK_BOOKING_TYPE,
    notes: "",
    operatorLabel: trainerId ? String(operator?.name || "担当トレーナー") : STORE_SHARED_NAME
  };
}

function hideFieldFor(input) {
  input?.closest?.(".field")?.setAttribute("hidden", "");
}

export function applyQuickBookingForm({
  documentRef = globalThis.document,
  locationRef = globalThis.location,
  operator = getOperatorProfile()
} = {}) {
  if (!documentRef || !locationRef || !isQuickBookingHash(locationRef.hash)) return false;
  const form = documentRef.getElementById("bookingForm");
  if (!form) return false;

  const customerName = documentRef.getElementById("customerName");
  const trainerId = documentRef.getElementById("trainerId");
  const duration = documentRef.getElementById("duration");
  const bookingType = documentRef.getElementById("bookingType");
  const notes = documentRef.getElementById("notes");
  const preset = quickBookingPreset(operator);

  if (customerName) customerName.value = preset.customerName;
  if (trainerId) trainerId.value = preset.trainerId;
  if (duration) duration.value = String(preset.duration);
  if (bookingType) bookingType.value = preset.type;
  if (notes) notes.value = preset.notes;

  [customerName, trainerId, duration, bookingType, notes].forEach(hideFieldFor);

  form.dataset.quickBooking = "true";
  const heading = documentRef.querySelector(".form-heading");
  const eyebrow = heading?.querySelector(".eyebrow");
  const title = heading?.querySelector("h1");
  const explanation = heading?.querySelector("p:last-child");
  const submit = form.querySelector('button[type="submit"]');

  if (eyebrow) eyebrow.textContent = "最短入力";
  if (title) title.textContent = "クイック予約";
  if (explanation) {
    explanation.textContent = `${preset.operatorLabel}として60分の予約枠を作成します。入力は予約日と開始時間だけです。`;
  }
  if (submit) submit.textContent = "クイック予約を登録";

  return true;
}

function scheduleApply(globalRef, attempt = 0) {
  const run = () => {
    if (applyQuickBookingForm()) return;
    if (attempt >= 8 || !isQuickBookingHash(globalRef.location?.hash)) return;
    scheduleApply(globalRef, attempt + 1);
  };
  if (typeof globalRef.requestAnimationFrame === "function") globalRef.requestAnimationFrame(run);
  else globalRef.setTimeout?.(run, 0);
}

export function installQuickBooking({
  globalRef = globalThis,
  documentRef = globalThis.document,
  sessionStorageRef = globalThis.sessionStorage
} = {}) {
  if (!documentRef || !globalRef?.location) return () => {};
  if (globalRef.__tamafitQuickBookingInstalled) return () => {};
  globalRef.__tamafitQuickBookingInstalled = true;

  const onClick = (event) => {
    const button = event.target.closest?.("[data-quick-booking]");
    if (!button) return;
    const route = quickBookingRoute(button.dataset.date);
    if (!route) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      sessionStorageRef?.setItem("tamafit_calendar_return_hash", globalRef.location.hash);
    } catch {
      // Back navigation still has the app-level fallback if session storage is unavailable.
    }
    globalRef.location.hash = route;
  };

  const onHashChange = () => scheduleApply(globalRef);
  documentRef.addEventListener("click", onClick, true);
  globalRef.addEventListener?.("hashchange", onHashChange);
  scheduleApply(globalRef);

  return () => {
    documentRef.removeEventListener("click", onClick, true);
    globalRef.removeEventListener?.("hashchange", onHashChange);
    delete globalRef.__tamafitQuickBookingInstalled;
  };
}

if (typeof document !== "undefined") {
  installQuickBooking();
}
