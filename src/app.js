import { BOOKING_TYPES, TRAINERS } from "./config.js";
import { parseRoute, navigate } from "./router.js";
import {
  OPERATORS,
  appState,
  getOperatorProfile,
  loadOperatorId,
  saveLastView,
  saveOperatorId
} from "./state.js";
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
import { renderHistoryView } from "./views/history-view.js";
import { renderError, renderLoading } from "./views/app-shell.js";
import { renderMonthView } from "./views/month-view.js";
import { renderWeekView } from "./views/week-view.js";

const app = document.getElementById("app");
const repository = createCalendarRepository();
const confirmDialog = document.getElementById("confirmDialog");
const toast = document.getElementById("toast");
const pwaInstallDialog = document.getElementById("pwaInstallDialog");
let lastCalendarHash = "";
let pendingRender = 0;
let toastTimer = null;

function ensureOperatorDialog() {
  let dialog = document.getElementById("operatorDialog");
  if (dialog) return dialog;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="operator-dialog" id="operatorDialog">
      <div class="operator-dialog__body">
        <p class="eyebrow">この端末を設定</p>
        <h2>操作者を選んでください</h2>
        <p>予約の担当初期値と操作履歴に使用します。</p>
        <div class="operator-dialog__choices">
          ${OPERATORS.map((operator) => `
            <button type="button" data-operator-choice="${operator.id}">
              <strong>${operator.name}</strong>
              <span>${operator.trainerId ? `新規予約の担当：${operator.name}` : "新規予約の担当：指定なし"}</span>
            </button>
          `).join("")}
        </div>
        <button class="operator-dialog__cancel" type="button" data-operator-cancel>変更しない</button>
      </div>
    </dialog>
  `);
  return document.getElementById("operatorDialog");
}

function chooseOperator({ required = false } = {}) {
  const dialog = ensureOperatorDialog();
  const cancelButton = dialog.querySelector("[data-operator-cancel]");
  cancelButton.hidden = required;

  return new Promise((resolve) => {
    const finish = (operatorId = "") => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("cancel", onCancel);
      if (operatorId) saveOperatorId(operatorId);
      if (dialog.open) dialog.close();
      resolve(operatorId ? getOperatorProfile() : null);
    };
    const onClick = (event) => {
      const choice = event.target.closest("[data-operator-choice]");
      if (choice) finish(choice.dataset.operatorChoice);
      if (event.target.closest("[data-operator-cancel]")) finish();
    };
    const onCancel = (event) => {
      event.preventDefault();
      if (!required) finish();
    };

    dialog.addEventListener("click", onClick);
    dialog.addEventListener("cancel", onCancel);
    dialog.showModal();
  });
}

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
  syncInstallBanner();
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

function showToast(message, { duration = 2800, actionLabel = "", onAction = null } = {}) {
  clearTimeout(toastTimer);
  toast.replaceChildren();
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(text);

  if (actionLabel && onAction) {
    const actionButton = document.createElement("button");
    actionButton.className = "toast__action";
    actionButton.type = "button";
    actionButton.textContent = actionLabel;
    actionButton.addEventListener("click", async () => {
      clearTimeout(toastTimer);
      actionButton.disabled = true;
      try {
        await onAction();
      } catch (error) {
        showToast(error.message || "元に戻せませんでした");
      }
    }, { once: true });
    toast.append(actionButton);
  }

  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
}

function reservationInputFromEvent(event) {
  return {
    customerName: event.customerName,
    trainerId: event.trainerId,
    startAt: event.startAt,
    endAt: event.endAt,
    duration: event.duration,
    type: event.type,
    notes: event.notes || ""
  };
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

function ensureSyncErrorDialog() {
  let dialog = document.getElementById("syncErrorDialog");
  if (dialog) return dialog;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="confirm-dialog sync-error-dialog" id="syncErrorDialog">
      <div class="confirm-dialog__body">
        <p class="eyebrow">同期エラー</p>
        <h2 data-sync-error-title>Googleカレンダーに反映できませんでした</h2>
        <div class="confirm-dialog__summary" data-sync-error-summary></div>
        <div class="confirm-dialog__actions is-single">
          <button class="button button--danger-solid button--wide" type="button" data-sync-error-close>確認しました</button>
        </div>
      </div>
    </dialog>
  `);
  dialog = document.getElementById("syncErrorDialog");
  const close = () => {
    if (dialog.open) dialog.close();
  };
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-sync-error-close]")) close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  return dialog;
}

function showSyncError({ title, event, error, rollbackMessage }) {
  const dialog = ensureSyncErrorDialog();
  const reason = escapeHtml(error?.message || "Googleカレンダーとの通信に失敗しました。");
  const name = escapeHtml(event?.customerName || "予約");
  const date = escapeHtml(String(event?.startAt || "").slice(0, 10));
  const time = escapeHtml(String(event?.startAt || "").slice(11, 16));
  dialog.querySelector("[data-sync-error-title]").textContent = title;
  dialog.querySelector("[data-sync-error-summary]").innerHTML = `
    <div class="sync-error-message">
      <p><strong>${name}</strong>${date && time ? `<br>${date} ${time}` : ""}</p>
      <p>${escapeHtml(rollbackMessage)}</p>
      <p class="sync-error-message__reason">理由：${reason}</p>
    </div>
  `;
  if (!dialog.open) dialog.showModal();
}

function rerenderCalendarIfVisible() {
  const route = parseRoute();
  if (["month", "week", "day"].includes(route.name)) {
    void renderRoute();
  }
}

function observeMutation(mutation, { title, rollbackMessage }) {
  mutation.committed
    .then(() => rerenderCalendarIfVisible())
    .catch((error) => {
      rerenderCalendarIfVisible();
      showSyncError({
        title,
        event: mutation.event,
        error,
        rollbackMessage
      });
    });
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOSSafari() {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  return isIOS && !isOtherIOSBrowser;
}

function installMode() {
  if (appState.isInstalled || isStandaloneApp()) return "";
  if (appState.installPrompt) return "android";
  if (isIOSSafari()) return "ios";
  return "";
}

function syncInstallBanner() {
  app.querySelector(".pwa-install-banner")?.remove();
  const mode = installMode();
  const main = app.querySelector(".app-main");
  if (!mode || !main) return;

  const label = mode === "android" ? "アプリとして追加" : "ホーム画面に追加";
  const description = mode === "android"
    ? "ホーム画面からすぐ開けます"
    : "Safariの共有メニューから追加できます";
  main.insertAdjacentHTML("afterbegin", `
    <section class="pwa-install-banner" aria-label="アプリとして追加">
      <div>
        <strong>${label}</strong>
        <span>${description}</span>
      </div>
      <button class="pwa-install-banner__button" type="button" data-action="install-app">追加</button>
    </section>
  `);
}

async function installApp() {
  if (appState.installPrompt) {
    const prompt = appState.installPrompt;
    appState.installPrompt = null;
    await prompt.prompt();
    const result = await prompt.userChoice;
    syncInstallBanner();
    showToast(result.outcome === "accepted" ? "アプリを追加しました" : "追加はいつでも行えます");
    return;
  }

  if (isIOSSafari() && pwaInstallDialog && !pwaInstallDialog.open) {
    pwaInstallDialog.showModal();
  }
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
      html = renderBookingForm({
        defaultDate: toISODate(date),
        defaultTrainerId: getOperatorProfile()?.trainerId ?? "tamai"
      });
    }

    if (route.name === "booking-edit") {
      const event = await repository.getEvent(route.id);
      if (!event) throw new Error("編集する予約が見つかりませんでした。");
      html = renderBookingForm({ event, defaultDate: event.startAt.slice(0, 10) });
    }

    if (route.name === "history") {
      html = renderHistoryView(await repository.listHistory());
    }

    if (renderId === pendingRender) {
      app.innerHTML = html;
      syncInstallBanner();
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
  const isSchedule = ["blocked", "tentative", "event"].includes(typeSelect.value);
  nameInput.required = true;
  nameInput.placeholder = isSchedule ? "例：清掃・打ち合わせ" : "例：山田 花子";
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

  if (action === "go-home") {
    navigate(`month/${monthRouteValue(new Date())}`);
  }

  if (action === "install-app") {
    await installApp();
  }

  if (action === "change-operator") {
    const operator = await chooseOperator();
    if (operator) {
      await renderRoute();
      showToast(`この端末を「${operator.name}」に変更しました`);
    }
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

  if (action === "open-history") {
    rememberReturnLocation();
    navigate("history");
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

    const mutation = await repository.deleteEventOptimistic(event.id);
    navigate(`day/${event.startAt.slice(0, 10)}`);
    showToast("予約を削除しました", {
      duration: 8000,
      actionLabel: "元に戻す",
      onAction: async () => {
        try {
          await mutation.committed;
        } catch {
          return;
        }
        const restore = repository.createEventOptimistic(reservationInputFromEvent(event));
        navigate(`day/${event.startAt.slice(0, 10)}`);
        showToast("予約を復元しました");
        observeMutation(restore, {
          title: "予約を復元できませんでした",
          rollbackMessage: "復元用の仮予約を取り消しました。"
        });
      }
    });
    observeMutation(mutation, {
      title: "予約を削除できませんでした",
      rollbackMessage: "削除前の予約を画面に戻しました。"
    });
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
  const customerName = String(formData.get("customerName") || "").trim();
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
    showFormMessage("お客様名または予定名を入力してください。");
    return;
  }

  const analysis = repository.analyzeBooking
    ? await repository.analyzeBooking(input, eventId)
    : {
        conflicts: await repository.findConflicts(input, eventId),
        bufferWarnings: await repository.findBufferWarnings(input, eventId)
      };

  if (analysis.conflicts.length) {
    const conflict = analysis.conflicts[0];
    showFormMessage(`同じ担当者に ${conflict.startAt.slice(11, 16)}〜${conflict.endAt.slice(11, 16)} の予約があります。時間を変更してください。`);
    return;
  }

  const bufferWarnings = analysis.bufferWarnings;
  const bufferWarningSummary = bufferWarnings.length ? `
    <div class="booking-buffer-warning" role="note">
      <strong>前後30分の確認</strong>
      <p>同じ担当者の予約と30分未満の間隔です。準備・移動時間を確認し、問題なければこのまま登録してください。</p>
      <ul>
        ${bufferWarnings.map((event) => `<li>${escapeHtml(event.startAt.slice(11, 16))}〜${escapeHtml(event.endAt.slice(11, 16))}</li>`).join("")}
      </ul>
    </div>
  ` : "";

  const trainer = TRAINERS.find((item) => item.id === input.trainerId);
  const bookingType = BOOKING_TYPES.find((item) => item.id === input.type);
  const confirmed = await askForConfirmation({
    title: eventId ? "変更内容を保存しますか？" : "この内容で予約しますか？",
    summary: `
      <dl>
        <div><dt>お客様</dt><dd>${escapeHtml(input.customerName)}</dd></div>
        <div><dt>日時</dt><dd>${escapeHtml(formatDayTitle(parseISODate(date)))}<br>${escapeHtml(time)}〜${escapeHtml(input.endAt.slice(11, 16))}</dd></div>
        <div><dt>担当</dt><dd>${escapeHtml(trainer?.name || "指定なし")}</dd></div>
        <div><dt>種類</dt><dd>${escapeHtml(bookingType?.name || "通常予約")}</dd></div>
      </dl>
      ${bufferWarningSummary}
    `,
    confirmLabel: eventId ? "変更を保存" : "予約を登録"
  });
  if (!confirmed) return;

  if (eventId) {
    const mutation = await repository.updateEventOptimistic(eventId, input);
    navigate(`day/${date}`);
    showToast("予約を変更しました");
    observeMutation(mutation, {
      title: "予約の変更を保存できませんでした",
      rollbackMessage: "変更前の予約内容に戻しました。"
    });
  } else {
    const mutation = repository.createEventOptimistic(input);
    navigate(`day/${date}`);
    showToast("予約を登録しました");
    observeMutation(mutation, {
      title: "予約を登録できませんでした",
      rollbackMessage: "画面上の仮予約を取り消しました。"
    });
  }
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
window.addEventListener("online", () => {
  const route = parseRoute();
  if (["month", "week", "day"].includes(route.name)) void renderRoute({ forceRefresh: true });
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  appState.installPrompt = event;
  syncInstallBanner();
});

window.addEventListener("appinstalled", () => {
  appState.installPrompt = null;
  appState.isInstalled = true;
  syncInstallBanner();
  showToast("アプリを追加しました");
});

pwaInstallDialog?.addEventListener("click", (event) => {
  if (event.target.closest("[data-pwa-dialog-close]")) pwaInstallDialog.close();
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}

async function startApp() {
  if (!loadOperatorId()) await chooseOperator({ required: true });
  if (!window.location.hash) {
    navigate(`month/${monthRouteValue(new Date())}`, { replace: true });
  } else {
    renderRoute();
  }
}

startApp().catch((error) => {
  app.innerHTML = renderError(escapeHtml(error.message || "アプリを起動できませんでした。"));
});
