const SWIPE_ACTIVATION_PX = 10;
const SWIPE_TRIGGER_PX = 48;
const SWIPE_FLING_PX = 24;
const SWIPE_FLING_VELOCITY = 0.5;
const SWIPE_SETTLE_MS = 90;
const SWIPE_SURFACE_SELECTOR = ".month-calendar, .week-list";

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function routeForSwipe(hash, direction) {
  const delta = direction >= 0 ? 1 : -1;
  const month = String(hash || "").match(/^#\/month\/(\d{4})-(\d{2})/);
  if (month) {
    const date = new Date(Number(month[1]), Number(month[2]) - 1 + delta, 1);
    return `#/month/${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  }

  const week = String(hash || "").match(/^#\/week\/(\d{4})-(\d{2})-(\d{2})/);
  if (week) {
    const date = new Date(Number(week[1]), Number(week[2]) - 1, Number(week[3]));
    date.setDate(date.getDate() + (delta * 7));
    return `#/week/${formatDate(date)}`;
  }

  return null;
}

function installSwipeStyles() {
  if (document.getElementById("calendarSwipeStyles")) return;
  const style = document.createElement("style");
  style.id = "calendarSwipeStyles";
  style.textContent = `
    ${SWIPE_SURFACE_SELECTOR} {
      touch-action: pan-y;
      overscroll-behavior-x: contain;
    }
    ${SWIPE_SURFACE_SELECTOR}.is-calendar-swiping {
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(style);
}

function resetSurface(surface, animated = true) {
  if (!surface?.isConnected) return;
  surface.style.transition = animated ? "transform 120ms ease-out, opacity 120ms ease-out" : "";
  surface.style.transform = "translate3d(0, 0, 0)";
  surface.style.opacity = "1";
  surface.classList.remove("is-calendar-swiping");
  if (animated) {
    setTimeout(() => {
      if (!surface.isConnected) return;
      surface.style.transition = "";
      surface.style.transform = "";
      surface.style.opacity = "";
    }, 140);
  } else {
    surface.style.transform = "";
    surface.style.opacity = "";
  }
}

export function installCalendarSwipeNavigation({ root = document } = {}) {
  installSwipeStyles();
  let gesture = null;
  let suppressClickUntil = 0;

  root.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.pointerType === "mouse") return;
    const surface = event.target.closest?.(SWIPE_SURFACE_SELECTOR);
    if (!surface) return;
    gesture = {
      pointerId: event.pointerId,
      surface,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      horizontal: false,
      cancelled: false
    };
  });

  root.addEventListener("pointermove", (event) => {
    if (!gesture || event.pointerId !== gesture.pointerId || gesture.cancelled) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!gesture.horizontal) {
      if (absX < SWIPE_ACTIVATION_PX && absY < SWIPE_ACTIVATION_PX) return;
      if (absY >= absX) {
        gesture.cancelled = true;
        return;
      }
      gesture.horizontal = true;
      gesture.surface.classList.add("is-calendar-swiping");
      gesture.surface.setPointerCapture?.(event.pointerId);
    }

    event.preventDefault();
    const limit = Math.max(80, gesture.surface.clientWidth * 0.55);
    const visualX = Math.max(-limit, Math.min(limit, dx));
    gesture.surface.style.transition = "none";
    gesture.surface.style.transform = `translate3d(${visualX}px, 0, 0)`;
    gesture.surface.style.opacity = String(1 - Math.min(0.12, Math.abs(visualX) / Math.max(1, gesture.surface.clientWidth) * 0.18));
  }, { passive: false });

  function finish(event, cancelled = false) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const current = gesture;
    gesture = null;

    if (cancelled || current.cancelled || !current.horizontal) {
      resetSurface(current.surface, false);
      return;
    }

    const dx = event.clientX - current.startX;
    const duration = Math.max(1, performance.now() - current.startTime);
    const velocity = Math.abs(dx) / duration;
    const triggerDistance = Math.max(SWIPE_TRIGGER_PX, current.surface.clientWidth * 0.12);
    const shouldNavigate = Math.abs(dx) >= triggerDistance
      || (Math.abs(dx) >= SWIPE_FLING_PX && velocity >= SWIPE_FLING_VELOCITY);

    suppressClickUntil = performance.now() + 400;

    if (!shouldNavigate) {
      resetSurface(current.surface, true);
      return;
    }

    const route = routeForSwipe(window.location.hash, dx < 0 ? 1 : -1);
    if (!route) {
      resetSurface(current.surface, true);
      return;
    }

    current.surface.style.transition = `transform ${SWIPE_SETTLE_MS}ms ease-out, opacity ${SWIPE_SETTLE_MS}ms ease-out`;
    current.surface.style.transform = `translate3d(${dx < 0 ? "-18%" : "18%"}, 0, 0)`;
    current.surface.style.opacity = "0.82";

    setTimeout(() => {
      resetSurface(current.surface, false);
      window.location.hash = route;
    }, SWIPE_SETTLE_MS);
  }

  root.addEventListener("pointerup", (event) => finish(event));
  root.addEventListener("pointercancel", (event) => finish(event, true));

  root.addEventListener("click", (event) => {
    if (performance.now() >= suppressClickUntil) return;
    if (!event.target.closest?.(SWIPE_SURFACE_SELECTOR)) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

if (typeof document !== "undefined") {
  installCalendarSwipeNavigation();
}
