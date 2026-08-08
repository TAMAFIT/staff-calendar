import { BOOKING_TYPES, TRAINERS } from "./config.js";
import { parseRoute, navigate } from "./router.js";
import { appState, saveLastView } from "./state.js";
import { createCalendarRepository } from "./services/repository-factory.js";
import {
  addDays,
  addMinutesToDateTime,
  addMonths,
  combineDateAndTime,
  formatDayTitle,
  getMonthGrid,
  getWeekDays,
  isValidISODate,
  monthRouteValue,
  parseISODate,
  parseMonthRoute,
  toISODate
} from "./utils/date.js";
import { escapeHtml } from "./utils/html.js";
import { renderBookingForm } from "./views/booking-form-view.js";
import { renderDayView } from "./views/day-view.js";
import { renderError, renderLoading } from "./views/app-shell.js";
import { renderMonthView } from "./views/month-view.js";
import { renderWeekView } from "./views/week-view.js";

const app = document.getElementById("app");
const repository = createCalendarRepository();
const confirmDialog = document.getElementById("confirmDialog");
const toast = document.getElementById("toast");
let lastCalendarHash = "";
let pendingRender = 0;
let toastTimer = null;

function calendarRouteConfig(route) {
  if (route.name === "month") {
    const anchor = parseMonthRoute(route.month);
    const days = getMonthGrid(anchor);
    return {
      startDate: toISODate(days[0]),
      endDate: toISODate(days.at(-1)),
      render: (events, isRefreshing) => renderMonthView(anchor, events, { isRefreshing }),
      hash: window.location.hash,
      view: "month"
    };
  }

  if (route.name === "week") {
    const anchor = currentDateForRoute(route);
    const days = getWeekDays(anchor);
    return {
      startDate: toISODate(days[0]),
      endDate: toISODate(days.at(-1)),
      render: (events, isRefreshing) => renderWeekView(anchor, events, { isRefreshing }),
      hash: window.location.hash,
      view: "week"
    };
  }

  if (route.name === "day") {
    const date = currentDateForRoute(route);
    const isoDate = toISODate(date);
    return {
      startDate: isoDate,
      endDate: isoDate,
      render: (events, isRefreshing) => renderDayView(date, events, { isRefreshing }),
      hash: "",
      view: ""
    };
  }

  return null;
}

function setRouteLoading(isLoading) {
  app.classList.toggle("is-refreshing", isLoading);
  app.setAttribute("aria-busy", String(isLoading));
}

function displayCalendar(config, events, { isRefreshing = false, resetScroll = true } = {}) {
  app.innerHTML = config.render(events, isRefreshing);
  setRouteLoading(false);
  if (config.hash) lastCalendarHash = config.hash;
  if (config.view) saveLastView(config.view);
  if (resetScroll) window.scrollTo({ top: 0, behavior: "instant" });
}

async function renderCalendarRoute(config, renderId, forceRefresh) {
  const cached = repository.getCachedEvents?.(config.startDate, config.endDate);
  const shouldRefresh = forceRefresh || !cached || !cached.isFresh;

  if (cached) {
    displayCalendar(config, cached.events, { isRefreshing: shouldRefresh });
    if (!shouldRefresh) return;

    repository.refreshEvents(config.startDate, config.endDate)
      .then((events) => {
        if (renderId !== pendingRender) return;
        displayCalendar(config, events, { resetScroll: false });
      })
      .catch((error) => {
        if (renderId !== pendingRender) return;
        setRouteLoading(false);
        showToast(error.message || "最新の予約状況を取得できませんでした");
      });
    return;
  }

  if (app.querySelector(".calendar-view, .day-view")) {
    setRouteLoading(true);
  } else {
    app.innerHTML = renderLoading();
  }

  const events = forceRefresh
    ? await repository.refreshEvents(config.startDate, config.endDate)
    : await repository.listEvents(config.startDate, config.endDate);
  if (renderId === pendingRender) displayCalendar(config, events);
}

function currentDateForRoute(route) {
  if (route.name === "month") return parseMonthRoute(route.month);
  if ((route.name === "week" || route.name === "day" || route.name === "booking-new") && isValidISODate(route.date)) {
    return parseISODate(route.date);
  }
  return new Date();
}

function rememberReturnLocation() {
  if (["month", "week", "day"].includes(parseRoute().name)) {
    sessionStorage.setItem("tamafit_calendar_return_hash", window.location.hash);
  }
}

function getReturnLocation(fallbackDate = new Date()) {
  return sessionStorage.getItem("tamafit_calendar_return_hash") || lastCalendarHash || `#/month/${monthRouteValue(fallbackDate)}`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function showFormMessage(message) {
  const element = document.getElementById("formMessage");
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-visible", Boolean(message));
  if (message) element.scrollIntoView({ behavior: "smooth", block: "center" });
}

function askForConfirmation({ eyebrow = "内容確認", title, summary, confirmLabel = "保存する", danger = false }) {
  return new Promise((resolve) => {
    const eyebrowElement = document.getElementById("confirmEyebrow");
    const titleElement = document.getElementById("confirmTitle");
    const summaryElement = document.getElementById("confirmSummary");
    const cancelButton = confirmDialog.querySelector("[data-dialog-cancel]");
    const confirmButton = confirmDialog.querySelector("[data-dialog-confirm]");

    eyebrowElement.textContent = eyebrow;
    titleElement.textContent = title;
    summaryElement.innerHTML = summary;
    confirmButton.textContent = confirmLabel;
    confirmButton.classList.toggle("button--danger-solid", danger);

    const finish = (result) => {
      cancelButton.removeEventListener("click", onCancel);
      confirmButton.removeEventListener("click", onConfirm);
      confirmDialog.removeEventListener("cancel", onCancel);
      if (confirmDialog.open) confirmDialog.close();
      resolve(result);
    };
    const onCancel = (event) => {
      event?.preventDefault();
      finish(false);
    };
    const onConfirm = () => finish(true);

    cancelButton.addEventListener("click", onCancel);
    confirmButton.addEventListener("click", onConfirm);
    confirmDialog.addEventListener("cancel", onCancel);
    confirmDialog.showModal();
  });
}

async function renderRoute({ forceRefresh = false } = {}) {
  const renderId = ++pendingRender;
  const route = parseRoute();
  appState.route = route;

  const calendarConfig = calendarRouteConfig(route);
  if (calendarConfig) {
    try {
      await renderCalendarRoute(calendarConfig, renderId, forceRefresh);
    } catch (error) {
      if (renderId === pendingRender) {
        app.innerHTML = renderError(escapeHtml(error.message || "読み込みに失敗しました。"));
        setRouteLoading(false);
      }
    }
    return;
  }

  app.innerHTML = renderLoading();

  try {
    let html = "";

    if (route.name === "booking-new") {
      const date = currentDateForRoute(route);
      html = renderBookingForm({ defaultDate: toISODate(date) });
    }

    if (route.name === "booking-edit") {
      const event = await repository.getEvent(route.id);
      if (!event) throw new Error("編集する予約が見つかりませんでした。");
      html = renderBookingForm({ event, defaultDate: event.startAt.slice(0, 10) });
    }

    if (renderId === pendingRender) {
      app.innerHTML = html;
      window.scrollTo({ top: 0, behavior: "instant" });
      syncBookingTypeField();
    }
  } catch (error) {
    if (renderId === pendingRender) {
      app.innerHTML = renderError(escapeHtml(error.message || "不明なエラーが発生しました。"));
    }
  }
}

function syncBookingTypeField() {
  const typeSelect = document.getElementById("bookingType");
  const nameInput = document.getElementById("customerName");
  if (!typeSelect || !nameInput) return;
  const isBlocked = typeSelect.value === "blocked";
  nameInput.required = !isBlocked;
  nameInput.placeholder = isBlocked ? "例：清掃・打ち合わせ" : "例：山田 花子";
}

function bookingDateFromContext(button) {
  if (button?.dataset.date && isValidISODate(button.dataset.date)) return button.dataset.date;
  const route = parseRoute();
  if ((route.name === "day" || route.name === "week") && isValidISODate(route.date)) return route.date;
  if (route.name === "month") {
    const anchor = parseMonthRoute(route.month);
    const today = new Date();
    return anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear()
      ? toISODate(today)
      : toISODate(anchor);
  }
  return toISODate(new Date());
}

async function handleAction(button) {
  const action = button.dataset.action;
  const route = parseRoute();

  if (action === "previous-month" || action === "next-month") {
    const offset = action === "previous-month" ? -1 : 1;
    navigate(`month/${monthRouteValue(addMonths(parseMonthRoute(route.month), offset))}`);
  }

  if (action === "previous-week" || action === "next-week") {
    const offset = action === "previous-week" ? -7 : 7;
    navigate(`week/${toISODate(addDays(currentDateForRoute(route), offset))}`);
  }

  if (action === "today") {
    const today = new Date();
    navigate(route.name === "week" ? `week/${toISODate(today)}` : `month/${monthRouteValue(today)}`);
  }

  if (action === "show-month") {
    navigate(`month/${monthRouteValue(currentDateForRoute(route))}`);
  }

  if (action === "show-week") {
    navigate(`week/${toISODate(currentDateForRoute(route))}`);
  }

  if (action === "open-day") {
    lastCalendarHash = window.location.hash;
    navigate(`day/${button.dataset.date}`);
  }

  if (action === "new-booking") {
    rememberReturnLocation();
    navigate(`booking/new?date=${bookingDateFromContext(button)}`);
  }

  if (action === "edit-booking") {
    rememberReturnLocation();
    navigate(`booking/edit/${encodeURIComponent(button.dataset.id)}`);
  }

  if (action === "back-to-calendar") {
    navigate((lastCalendarHash || `#/month/${monthRouteValue(currentDateForRoute(route))}`).replace(/^#\//, ""));
  }

  if (action === "back-from-form") {
    navigate(getReturnLocation().replace(/^#\//, ""));
  }

  if (action === "reload") {
    renderRoute({ forceRefresh: true });
  }

  if (action === "delete-booking") {
    const event = await repository.getEvent(button.dataset.id);
    if (!event) return;
    const confirmed = await askForConfirmation({
      eyebrow: "予約の削除",
      title: "この予約を削除しますか？",
      summary: `
        <dl>
          <div><dt>お客様</dt><dd>${escapeHtml(event.customerName)}</dd></div>
          <div><dt>日時</dt><dd>${escapeHtml(event.startAt.slice(0, 10))} ${escapeHtml(event.startAt.slice(11, 16))}</dd></div>
        </dl>
      `,
      confirmLabel: "削除する",
      danger: true
    });
    if (!confirmed) return;
    await repository.deleteEvent(event.id);
    showToast("予約を削除しました");
    navigate(`day/${event.startAt.slice(0, 10)}`);
  }
}

async function handleBookingSubmit(form) {
  showFormMessage("");
  const formData = new FormData(form);
  const eventId = form.dataset.eventId || null;
  const date = formData.get("date");
  const time = formData.get("time");
  const duration = Number(formData.get("duration"));
  const type = formData.get("type");
  const customerName = String(formData.get("customerName") || "").trim() || (type === "blocked" ? "予定ブロック" : "");
  const startAt = combineDateAndTime(date, time);
  const input = {
    customerName,
    trainerId: formData.get("trainerId"),
    startAt,
    endAt: addMinutesToDateTime(startAt, duration),
    duration,
    type,
    notes: String(formData.get("notes") || "").trim()
  };

  if (!customerName) {
    showFormMessage("お客様名を入力してください。");
    return;
  }

  const conflicts = await repository.findConflicts(input, eventId);
  if (conflicts.length) {
    const conflict = conflicts[0];
    showFormMessage(`同じ担当者に ${conflict.startAt.slice(11, 16)}〜${conflict.endAt.slice(11, 16)} の予約があります。時間を変更してください。`);
    return;
  }

  const trainer = TRAINERS.find((item) => item.id === input.trainerId);
  const bookingType = BOOKING_TYPES.find((item) => item.id === input.type);
  const confirmed = await askForConfirmation({
    title: eventId ? "変更内容を保存しますか？" : "この内容で予約しますか？",
    summary: `
      <dl>
        <div><dt>お客様</dt><dd>${escapeHtml(input.customerName)}</dd></div>
        <div><dt>日時</dt><dd>${escapeHtml(formatDayTitle(parseISODate(date)))}<br>${escapeHtml(time)}〜${escapeHtml(input.endAt.slice(11, 16))}</dd></div>
        <div><dt>担当</dt><dd>${escapeHtml(trainer?.name || "担当未定")}</dd></div>
        <div><dt>種類</dt><dd>${escapeHtml(bookingType?.name || "通常予約")}</dd></div>
      </dl>
    `,
    confirmLabel: eventId ? "変更を保存" : "予約を登録"
  });
  if (!confirmed) return;

  if (eventId) {
    await repository.updateEvent(eventId, input);
    showToast("予約を変更しました");
  } else {
    await repository.createEvent(input);
    showToast("予約を登録しました");
  }
  navigate(`day/${date}`);
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  handleAction(button).catch((error) => showToast(error.message || "操作に失敗しました"));
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "bookingForm") return;
  event.preventDefault();
  handleBookingSubmit(event.target).catch((error) => showFormMessage(error.message || "保存に失敗しました。"));
});

app.addEventListener("change", (event) => {
  if (event.target.id === "bookingType") syncBookingTypeField();
});

window.addEventListener("hashchange", renderRoute);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  appState.installPrompt = event;
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}

if (!window.location.hash) {
  navigate(`month/${monthRouteValue(new Date())}`, { replace: true });
} else {
  renderRoute();
}
