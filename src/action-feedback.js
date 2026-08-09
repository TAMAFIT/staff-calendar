const TOAST_VISIBLE_MS = 1100;
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
      top: calc(82px + env(safe-area-inset-top));
      z-index: 3000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: min(78vw, 360px);
      min-width: 240px;
      min-height: 68px;
      padding: 16px 24px;
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 20px;
      background: rgba(13, 143, 77, 0.97);
      color: #fff;
      box-shadow: 0 14px 38px rgba(8, 73, 40, 0.3);
      font-size: 21px;
      font-weight: 900;
      letter-spacing: 0.04em;
      line-height: 1.1;
      pointer-events: none;
      opacity: 0;
      transform: translate3d(-50%, -14px, 0) scale(0.96);
      transition: opacity 140ms ease-out, transform 190ms cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }

    .action-feedback::before {
      content: "✓";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-right: 12px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
      font-size: 22px;
      font-weight: 900;
      line-height: 1;
      flex: 0 0 auto;
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
