const SWIPE_ACTIVATION_PX = 8;
const SWIPE_DISTANCE_RATIO = 0.28;
const SWIPE_MIN_DISTANCE_PX = 92;
const SWIPE_FLING_DISTANCE_RATIO = 0.16;
const SWIPE_FLING_MIN_DISTANCE_PX = 60;
const SWIPE_FLING_VELOCITY = 0.85;
const SWIPE_SNAPBACK_MS = 230;
const SWIPE_ENTER_MS = 240;
const SWIPE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const SWIPE_SURFACE_SELECTOR = ".month-calendar, .week-list";

let pendingEntryDirection = 0;

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

export function shouldNavigateSwipe({ distance, width, velocity = 0 }) {
  const absDistance = Math.abs(Number(distance) || 0);
  const safeWidth = Math.max(1, Number(width) || 1);
  const absVelocity = Math.abs(Number(velocity) || 0);
  const distanceThreshold = Math.max(SWIPE_MIN_DISTANCE_PX, safeWidth * SWIPE_DISTANCE_RATIO);
  const flingDistance = Math.max(SWIPE_FLING_MIN_DISTANCE_PX, safeWidth * SWIPE_FLING_DISTANCE_RATIO);

  return absDistance >= distanceThreshold
    || (absDistance >= flingDistance && absVelocity >= SWIPE_FLING_VELOCITY);
}

function installSwipeStyles() {
  if (document.getElementById("calendarSwipeStyles")) return;
  const style = document.createElement("style");
  style.id = "calendarSwipeStyles";
  style.textContent = `
    ${SWIPE_SURFACE_SELECTOR} {
      touch-action: pan-y;
      overscroll-behavior-x: contain;
      transform: translate3d(0, 0, 0);
    }
    ${SWIPE_SURFACE_SELECTOR}.is-calendar-swiping {
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
}

function cleanupSurface(surface) {
  if (!surface?.isConnected) return;
  surface.classList.remove("is-calendar-swiping");
  surface.style.transition = "";
  surface.style.transform = "";
  surface.style.pointerEvents = "";
}

function snapSurfaceBack(surface) {
  if (!surface?.isConnected) return;
  surface.style.transition = `transform ${SWIPE_SNAPBACK_MS}ms ${SWIPE_EASING}`;
  surface.style.transform = "translate3d(0, 0, 0)";
  setTimeout(() => cleanupSurface(surface), SWIPE_SNAPBACK_MS + 30);
}

function animateIncomingSurface(root, direction) {
  const findSurface = () => root.querySelector?.(SWIPE_SURFACE_SELECTOR);
  const surface = findSurface();
  if (!surface) {
    requestAnimationFrame(() => {
      const retry = findSurface();
      if (retry) animateIncomingSurface(root, direction);
    });
    return;
  }

  const width = Math.max(1, surface.clientWidth || window.innerWidth || 1);
  const startX = direction > 0 ? width : -width;
  surface.classList.add("is-calendar-swiping");
  surface.style.transition = "none";
  surface.style.transform = `translate3d(${startX}px, 0, 0)`;
  surface.style.pointerEvents = "none";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!surface.isConnected) return;
      surface.style.transition = `transform ${SWIPE_ENTER_MS}ms ${SWIPE_EASING}`;
      surface.style.transform = "translate3d(0, 0, 0)";
      setTimeout(() => cleanupSurface(surface), SWIPE_ENTER_MS + 30);
    });
  });
}

export function installCalendarSwipeNavigation({ root = document } = {}) {
  installSwipeStyles();
  let gesture = null;
  let suppressClickUntil = 0;

  root.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.pointerType === "mouse") return;
    const surface = event.target.closest?.(SWIPE_SURFACE_SELECTOR);
    if (!surface) return;
    const now = performance.now();
    gesture = {
      pointerId: event.pointerId,
      surface,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: now,
      velocityX: 0,
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
    const now = performance.now();
    const elapsed = Math.max(1, now - gesture.lastTime);
    const instantVelocity = (event.clientX - gesture.lastX) / elapsed;
    gesture.velocityX = (gesture.velocityX * 0.55) + (instantVelocity * 0.45);
    gesture.lastX = event.clientX;
    gesture.lastTime = now;

    const width = Math.max(1, gesture.surface.clientWidth || window.innerWidth || 1);
    const maxTravel = width * 0.96;
    const absDx = Math.abs(dx);
    const visualX = absDx <= maxTravel
      ? dx
      : Math.sign(dx) * (maxTravel + ((absDx - maxTravel) * 0.18));

    gesture.surface.style.transition = "none";
    gesture.surface.style.transform = `translate3d(${visualX}px, 0, 0)`;
  }, { passive: false });

  function finish(event, cancelled = false) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const current = gesture;
    gesture = null;

    if (cancelled || current.cancelled || !current.horizontal) {
      cleanupSurface(current.surface);
      return;
    }

    const dx = event.clientX - current.startX;
    const idleFor = performance.now() - current.lastTime;
    const velocity = idleFor > 90 ? 0 : current.velocityX;
    const width = Math.max(1, current.surface.clientWidth || window.innerWidth || 1);
    const shouldNavigate = shouldNavigateSwipe({ distance: dx, width, velocity });

    suppressClickUntil = performance.now() + 450;

    if (!shouldNavigate) {
      snapSurfaceBack(current.surface);
      return;
    }

    const direction = dx < 0 ? 1 : -1;
    const route = routeForSwipe(window.location.hash, direction);
    if (!route) {
      snapSurfaceBack(current.surface);
      return;
    }

    const targetX = direction > 0 ? -width : width;
    const remainingRatio = Math.max(0, Math.min(1, (width - Math.min(width, Math.abs(dx))) / width));
    const exitDuration = Math.round(140 + (remainingRatio * 90));

    current.surface.style.pointerEvents = "none";
    current.surface.style.transition = `transform ${exitDuration}ms ${SWIPE_EASING}`;
    current.surface.style.transform = `translate3d(${targetX}px, 0, 0)`;

    pendingEntryDirection = direction;
    setTimeout(() => {
      window.location.hash = route;
    }, exitDuration);
  }

  root.addEventListener("pointerup", (event) => finish(event));
  root.addEventListener("pointercancel", (event) => finish(event, true));

  root.addEventListener("click", (event) => {
    if (performance.now() >= suppressClickUntil) return;
    if (!event.target.closest?.(SWIPE_SURFACE_SELECTOR)) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  window.addEventListener("hashchange", () => {
    if (!pendingEntryDirection) return;
    const direction = pendingEntryDirection;
    pendingEntryDirection = 0;
    queueMicrotask(() => animateIncomingSurface(root, direction));
  });
}

if (typeof document !== "undefined") {
  installCalendarSwipeNavigation();
}
