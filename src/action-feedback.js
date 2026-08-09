const TOAST_VISIBLE_MS = 900;
let hideTimer = null;

export function completionMessage(kind) {
  return ({
    create: "予約完了",
    update: "変更完了",
    delete: "削除完了"
  })[kind] || "完了";
}

function installStyles() {
  if (document.getElementById("actionFeedbackStyles")) return;
  const style = document.createElement("style");
  style.id = "actionFeedbackStyles";
  style.textContent = `
    .action-feedback {
      position: fixed;
      left: 50%;
      bottom: calc(28px + env(safe-area-inset-bottom));
      z-index: 3000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 116px;
      min-height: 44px;
      padding: 10px 18px;
      border-radius: 999px;
      background: rgba(20, 45, 32, 0.94);
      color: #fff;
      box-shadow: 0 8px 26px rgba(13, 49, 31, 0.22);
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1;
      pointer-events: none;
      opacity: 0;
      transform: translate3d(-50%, 12px, 0) scale(0.97);
      transition: opacity 140ms ease-out, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }

    .action-feedback.is-visible {
      opacity: 1;
      transform: translate3d(-50%, 0, 0) scale(1);
    }

    @media (prefers-reduced-motion: reduce) {
      .action-feedback {
        transition: opacity 80ms linear;
        transform: translate3d(-50%, 0, 0);
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureToast() {
  let toast = document.getElementById("actionFeedbackToast");
  if (toast) return toast;
  installStyles();
  toast = document.createElement("div");
  toast.id = "actionFeedbackToast";
  toast.className = "action-feedback";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.setAttribute("aria-atomic", "true");
  document.body.appendChild(toast);
  return toast;
}

export function showCompletionFeedback(kind) {
  const toast = ensureToast();
  toast.textContent = completionMessage(kind);
  clearTimeout(hideTimer);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  hideTimer = setTimeout(() => toast.classList.remove("is-visible"), TOAST_VISIBLE_MS);
}

export function installActionFeedback({ root = document } = {}) {
  root.addEventListener("submit", (event) => {
    const form = event.target.closest?.("#bookingForm");
    if (!form) return;
    const kind = form.dataset.eventId ? "update" : "create";

    // The local-first controller validates and navigates synchronously. Wait one task,
    // then only acknowledge the action if it actually reached a day view.
    setTimeout(() => {
      if (/^#\/day\//.test(window.location.hash)) showCompletionFeedback(kind);
    }, 0);
  });

  root.addEventListener("click", (event) => {
    const button = event.target.closest?.('[data-action="delete-booking"]');
    if (!button) return;
    setTimeout(() => {
      if (/^#\/day\//.test(window.location.hash)) showCompletionFeedback("delete");
    }, 0);
  });
}

if (typeof document !== "undefined") {
  installActionFeedback();
}
