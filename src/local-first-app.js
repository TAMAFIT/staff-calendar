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
import { renderError } from "./views/app-shell.js";
import { renderMonthView } from "./views/month-view.js";
import { renderWeekView } from "./views/week-view.js";

const app = document.getElementById("app");
const repository = createCalendarRepository();
const pwaInstallDialog = document.getElementById("pwaInstallDialog");
let lastCalendarHash = "";
let renderScheduled = false;
let historyOrganizeMode = false;
let historyRefreshInFlight = false;

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

function currentDateForRoute(route) {
  if (route.name === "month") return parseMonthRoute(route.month);
  if ((route.name === "week" || route.name === "day" || route.name === "booking-new") && isValidISODate(route.date)) {
    return parseISODate(route.date);
  }
  return new Date();
}

function calendarRouteConfig(route) {
  if (route.name === "month") {
    const anchor = parseMonthRoute(route.month);
    const days = getMonthGrid(anchor);
    return {
      startDate: toISODate(days[0]),
      endDate: toISODate(days.at(-1)),
      render: (events, history) => renderMonthView(anchor, events, history),
      view: "month"
    };
  }
  if (route.name === "week") {
    const anchor = currentDateForRoute(route);
    const days = getWeekDays(anchor);
    return {
      startDate: toISODate(days[0]),
      endDate: toISODate(days.at(-1)),
      render: (events, history) => renderWeekView(anchor, events, history),
      view: "week"
    };
  }
  if (route.name === "day") {
    const date = currentDateForRoute(route);
    const iso = toISODate(date);
    return {
      startDate: iso,
      endDate: iso,
      render: (events) => renderDayView(date, events),
      view: ""
    };
  }
  return null;
}

function rememberReturnLocation() {
  if (["month", "week", "day"].includes(parseRoute().name)) {
    sessionStorage.setItem("tamafit_calendar_return_hash", window.location.hash);
  }
}

function getReturnLocation(fallbackDate = new Date()) {
  return sessionStorage.getItem("tamafit_calendar_return_hash")
    || lastCalendarHash
    || `#/month/${monthRouteValue(fallbackDate)}`;
}

function renderCalendar(config) {
  const cached = repository.getCachedEvents(config.startDate, config.endDate);
  const history = repository.getCachedHistory?.() || [];
  app.innerHTML = config.render(cached.events, history);
  if (config.view) saveLastView(config.view);
  syncInstallBanner();

  if (!cached.isFresh) {
    repository.refreshEvents(config.startDate, config.endDate).catch(() => {
      // Reads never block the operator. The last local snapshot remains visible.
    });
  }
}

function syncHistorySelectionBar() {
  const selected = [...app.querySelectorAll("[data-history-select]:checked")];
  const count = app.querySelector("[data-history-selected-count]");
  const deleteButton = app.querySelector('[data-action="delete-history-selected"]');
  if (count) count.textContent = String(selected.length);
  if (deleteButton) deleteButton.disabled = selected.length === 0;
}

function renderHistoryScreen({ refresh = false } = {}) {
  app.innerHTML = renderHistoryView(repository.getCachedHistory?.() || [], { organizing: historyOrganizeMode });
  syncHistorySelectionBar();

  if (!refresh || historyRefreshInFlight || typeof repository.refreshHistory !== "function") return;
  historyRefreshInFlight = true;
  repository.refreshHistory()
    .then(() => {
      if (parseRoute().name !== "history") return;
      app.innerHTML = renderHistoryView(repository.getCachedHistory?.() || [], { organizing: historyOrganizeMode });
      syncHistorySelectionBar();
    })
    .catch(() => {})
    .finally(() => { historyRefreshInFlight = false; });
}

function renderRoute() {
  const route = parseRoute();
  appState.route = route;
  const calendar = calendarRouteConfig(route);
  if (calendar) {
    if (route.name === "month" || route.name === "week") lastCalendarHash = window.location.hash;
    renderCalendar(calendar);
    return;
  }

  if (route.name === "booking-new") {
    const date = currentDateForRoute(route);
    app.innerHTML = renderBookingForm({
      defaultDate: toISODate(date),
      defaultTrainerId: getOperatorProfile()?.trainerId ?? "tamai"
    });
    syncBookingTypeField();
    return;
  }

  if (route.name === "booking-edit") {
    const event = repository.getEventCached?.(route.id);
    if (event) {
      app.innerHTML = renderBookingForm({ event, defaultDate: event.startAt.slice(0, 10) });
      syncBookingTypeField();
      return;
    }
    app.innerHTML = renderError("この端末に予約データがありません。カレンダーへ戻って同期後にもう一度開いてください。");
    repository.getEvent(route.id).then((loaded) => {
      if (loaded && parseRoute().name === "booking-edit" && parseRoute().id === route.id) renderRoute();
    }).catch(() => {});
    return;
  }

  if (route.name === "history") {
    renderHistoryScreen({ refresh: true });
  }
}

function scheduleLocalRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    const route = parseRoute();
    if (route.name === "history") {
      renderHistoryScreen({ refresh: false });
      return;
    }
    if (["month", "week", "day"].includes(route.name)) renderRoute();
  });
}

function showFormMessage(message) {
  const element = document.getElementById("formMessage");
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-visible", Boolean(message));
}

function ensureSyncErrorDialog() {
  let dialog = document.getElementById("syncErrorDialog");
  if (dialog) return dialog;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="confirm-dialog sync-error-dialog" id="syncErrorDialog">
      <div class="confirm-dialog__body">
        <p class="eyebrow">Google同期</p>
        <h2 data-sync-error-title>Googleカレンダーに反映できませんでした</h2>
        <div class="confirm-dialog__summary" data-sync-error-summary></div>
        <div class="confirm-dialog__actions is-single">
          <button class="button button--danger-solid button--wide" type="button" data-sync-error-close>確認しました</button>
        </div>
      </div>
    </dialog>
  `);
  dialog = document.getElementById("syncErrorDialog");
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-sync-error-close]") && dialog.open) dialog.close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dialog.close();
  });
  return dialog;
}

function showSyncFailure(detail) {
  const dialog = ensureSyncErrorDialog();
  const event = detail.op?.before || repository.getEventCached?.(detail.op?.targetId);
  const title = detail.deferred
    ? "Googleカレンダーへの同期が遅れています"
    : "Googleカレンダーに反映できませんでした";
  const explanation = detail.deferred
    ? "端末上の予約はそのまま保持し、ネット接続中に自動で再試行します。"
    : "Google側で保存できなかったため、端末上の操作を元の状態へ戻しました。";
  dialog.querySelector("[data-sync-error-title]").textContent = title;
  dialog.querySelector("[data-sync-error-summary]").innerHTML = `
    <div class="sync-error-message">
      ${event?.customerName ? `<p><strong>${escapeHtml(event.customerName)}</strong><br>${escapeHtml(String(event.startAt || "").replace("T", " ").slice(0, 16))}</p>` : ""}
      <p>${escapeHtml(explanation)}</p>
      <p class="sync-error-message__reason">理由：${escapeHtml(detail.error?.message || "通信エラー")}</p>
    </div>
  `;
  if (!dialog.open) dialog.showModal();
  scheduleLocalRender();
}

function ensureHistoryDeleteDialog() {
  let dialog = document.getElementById("historyDeleteDialog");
  if (dialog) return dialog;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="confirm-dialog" id="historyDeleteDialog">
      <div class="confirm-dialog__body">
        <p class="eyebrow">操作履歴の整理</p>
        <h2 data-history-delete-title>履歴を削除しますか？</h2>
        <div class="confirm-dialog__summary" data-history-delete-summary></div>
        <div class="confirm-dialog__actions">
          <button class="button button--secondary" type="button" data-history-delete-cancel>キャンセル</button>
          <button class="button button--danger-solid" type="button" data-history-delete-confirm>履歴を削除</button>
        </div>
      </div>
    </dialog>
  `);
  return document.getElementById("historyDeleteDialog");
}

function confirmHistoryDeletion(historyIds) {
  const ids = (Array.isArray(historyIds) ? historyIds : [historyIds]).map(String).filter(Boolean);
  if (!ids.length) return Promise.resolve(false);
  const dialog = ensureHistoryDeleteDialog();
  const entries = repository.getCachedHistory?.().filter((entry) => ids.includes(String(entry.historyId || ""))) || [];
  const title = ids.length === 1 ? "この操作履歴を削除しますか？" : `${ids.length}件の操作履歴を削除しますか？`;
  const names = entries.map((entry) => entry.customerName).filter(Boolean).slice(0, 3);
  dialog.querySelector("[data-history-delete-title]").textContent = title;
  dialog.querySelector("[data-history-delete-summary]").innerHTML = `
    ${names.length ? `<p><strong>${escapeHtml(names.join("、"))}${entries.length > 3 ? " ほか" : ""}</strong></p>` : ""}
    <p>履歴だけを削除します。Googleカレンダーの予約自体は削除されません。</p>
  `;

  return new Promise((resolve) => {
    const finish = (accepted) => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("cancel", onCancel);
      if (dialog.open) dialog.close();
      resolve(accepted);
    };
    const onClick = (event) => {
      if (event.target.closest("[data-history-delete-confirm]")) finish(true);
      if (event.target.closest("[data-history-delete-cancel]")) finish(false);
    };
    const onCancel = (event) => {
      event.preventDefault();
      finish(false);
    };
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("cancel", onCancel);
    dialog.showModal();
  });
}

function syncBookingTypeField() {
  const typeSelect = document.getElementById("bookingType");
  const nameInput = document.getElementById("customerName");
  if (!typeSelect || !nameInput) return;
  const isSchedule = ["blocked", "tentative", "event"].includes(typeSelect.value);
  nameInput.placeholder = isSchedule ? "例：清掃・打ち合わせ" : "例：山田 花子";
}

function bookingDateFromContext(button) {
  if (button?.dataset.date && isValidISODate(button.dataset.date)) return button.dataset.date;
  const route = parseRoute();
  if ((route.name === "day" || route.name === "week") && isValidISODate(route.date)) return route.date;
  if (route.name === "month") return toISODate(parseMonthRoute(route.month));
  return toISODate(new Date());
}

async function handleAction(button) {
  const action = button.dataset.action;
  const route = parseRoute();

  if (action === "previous-month" || action === "next-month") {
    navigate(`month/${monthRouteValue(addMonths(parseMonthRoute(route.month), action === "previous-month" ? -1 : 1))}`);
    return;
  }
  if (action === "previous-week" || action === "next-week") {
    navigate(`week/${toISODate(addDays(currentDateForRoute(route), action === "previous-week" ? -7 : 7))}`);
    return;
  }
  if (action === "today" || action === "go-home") {
    navigate(`month/${monthRouteValue(new Date())}`);
    return;
  }
  if (action === "show-month") {
    navigate(`month/${monthRouteValue(currentDateForRoute(route))}`);
    return;
  }
  if (action === "show-week") {
    navigate(`week/${toISODate(currentDateForRoute(route))}`);
    return;
  }
  if (action === "open-day") {
    lastCalendarHash = window.location.hash;
    navigate(`day/${button.dataset.date}`);
    return;
  }
  if (action === "new-booking") {
    rememberReturnLocation();
    navigate(`booking/new?date=${bookingDateFromContext(button)}`);
    return;
  }
  if (action === "edit-booking") {
    rememberReturnLocation();
    navigate(`booking/edit/${encodeURIComponent(button.dataset.id)}`);
    return;
  }
  if (action === "back-to-calendar") {
    historyOrganizeMode = false;
    const destination = route.name === "history"
      ? getReturnLocation(currentDateForRoute(route))
      : (lastCalendarHash || `#/month/${monthRouteValue(currentDateForRoute(route))}`);
    navigate(destination.replace(/^#\//, ""));
    return;
  }
  if (action === "back-from-form") {
    navigate(getReturnLocation(currentDateForRoute(route)).replace(/^#\//, ""));
    return;
  }
  if (action === "open-history") {
    historyOrganizeMode = false;
    rememberReturnLocation();
    navigate("history");
    return;
  }
  if (action === "history-organize") {
    historyOrganizeMode = true;
    renderHistoryScreen({ refresh: false });
    return;
  }
  if (action === "history-organize-cancel") {
    historyOrganizeMode = false;
    renderHistoryScreen({ refresh: false });
    return;
  }
  if (action === "delete-history-one") {
    const id = button.dataset.historyId;
    if (!id || !await confirmHistoryDeletion([id])) return;
    repository.deleteHistoryOptimistic?.([id]);
    renderHistoryScreen({ refresh: false });
    return;
  }
  if (action === "delete-history-selected") {
    const ids = [...app.querySelectorAll("[data-history-select]:checked")].map((input) => input.value).filter(Boolean);
    if (!ids.length || !await confirmHistoryDeletion(ids)) return;
    historyOrganizeMode = false;
    repository.deleteHistoryOptimistic?.(ids);
    renderHistoryScreen({ refresh: false });
    return;
  }
  if (action === "reload") {
    navigate(getReturnLocation().replace(/^#\//, ""));
    return;
  }
  if (action === "change-operator") {
    const operator = await chooseOperator();
    if (operator) renderRoute();
    return;
  }
  if (action === "install-app") {
    await installApp();
    return;
  }
  if (action === "delete-booking") {
    const event = repository.getEventCached?.(button.dataset.id);
    if (!event) return;
    repository.deleteEventOptimistic(event.id);
    navigate(`day/${event.startAt.slice(0, 10)}`);
  }
}

function handleBookingSubmit(form) {
  showFormMessage("");
  const data = new FormData(form);
  const eventId = form.dataset.eventId || null;
  const date = String(data.get("date"));
  const time = String(data.get("time"));
  const duration = Number(data.get("duration"));
  const startAt = combineDateAndTime(date, time);
  const input = {
    customerName: String(data.get("customerName") || "").trim(),
    trainerId: String(data.get("trainerId") || ""),
    startAt,
    endAt: addMinutesToDateTime(startAt, duration),
    duration,
    type: String(data.get("type") || "member"),
    notes: String(data.get("notes") || "").trim()
  };

  if (!input.customerName) {
    showFormMessage("お客様名または予定名を入力してください。");
    return;
  }

  const analysis = repository.analyzeCachedBooking?.(input, eventId);
  if (analysis?.conflicts?.length) {
    const conflict = analysis.conflicts[0];
    showFormMessage(`同じ担当者に ${conflict.startAt.slice(11, 16)}〜${conflict.endAt.slice(11, 16)} の予約があります。`);
    return;
  }

  if (eventId) repository.updateEventOptimistic(eventId, input);
  else repository.createEventOptimistic(input);
  navigate(`day/${date}`);
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOSSafari() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
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
  main.insertAdjacentHTML("afterbegin", `
    <section class="pwa-install-banner" aria-label="アプリとして追加">
      <div><strong>${mode === "android" ? "アプリとして追加" : "ホーム画面に追加"}</strong><span>ホーム画面からすぐ開けます</span></div>
      <button class="pwa-install-banner__button" type="button" data-action="install-app">追加</button>
    </section>
  `);
}

async function installApp() {
  if (appState.installPrompt) {
    const prompt = appState.installPrompt;
    appState.installPrompt = null;
    await prompt.prompt();
    await prompt.userChoice;
    syncInstallBanner();
    return;
  }
  if (isIOSSafari() && pwaInstallDialog && !pwaInstallDialog.open) pwaInstallDialog.showModal();
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button) handleAction(button).catch(() => {});
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "bookingForm") return;
  event.preventDefault();
  try { handleBookingSubmit(event.target); } catch (error) { showFormMessage(error.message || "保存できませんでした。"); }
});
app.addEventListener("change", (event) => {
  if (event.target.id === "bookingType") syncBookingTypeField();
  if (event.target.matches?.("[data-history-select]")) syncHistorySelectionBar();
});

window.addEventListener("hashchange", renderRoute);
window.addEventListener("online", () => {
  repository.syncNow?.();
  repository.syncHistoryDeletes?.();
  repository.refreshHistory?.().then(scheduleLocalRender).catch(() => {});
  const config = calendarRouteConfig(parseRoute());
  if (config) repository.refreshEvents(config.startDate, config.endDate).catch(() => {});
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
});
pwaInstallDialog?.addEventListener("click", (event) => {
  if (event.target.closest("[data-pwa-dialog-close]")) pwaInstallDialog.close();
});

repository.onSyncFailure?.(showSyncFailure);
repository.onChange?.(scheduleLocalRender);

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}

async function startApp() {
  if (!loadOperatorId()) await chooseOperator({ required: true });
  if (!window.location.hash) navigate(`month/${monthRouteValue(new Date())}`, { replace: true });
  else renderRoute();

  const today = new Date();
  const start = toISODate(addMonths(today, -3));
  const end = toISODate(addMonths(today, 6));
  repository.refreshEvents(start, end).catch(() => {});
  repository.refreshHistory?.().then(scheduleLocalRender).catch(() => {});
  repository.syncHistoryDeletes?.();
  repository.syncNow?.();
}

startApp().catch((error) => {
  app.innerHTML = renderError(escapeHtml(error.message || "アプリを起動できませんでした。"));
});
