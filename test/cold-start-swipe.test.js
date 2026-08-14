import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const serviceWorker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");

test("swipe navigation is initialized before the calendar app renders", () => {
  const swipeIndex = indexHtml.indexOf('./src/calendar-swipe.js');
  const appIndex = indexHtml.indexOf('./src/local-first-app.js');

  assert.notEqual(swipeIndex, -1);
  assert.notEqual(appIndex, -1);
  assert.ok(swipeIndex < appIndex, "calendar-swipe.js must execute before local-first-app.js");
});

test("installed app scripts and styles use cached-first startup with background refresh", () => {
  assert.match(serviceWorker, /function cachedFirstAndRefresh\(/);
  assert.match(serviceWorker, /request\.destination === "script" \|\| request\.destination === "style"/);
  assert.match(serviceWorker, /event\.respondWith\(cachedFirstAndRefresh\(request, event\)\)/);
  assert.match(serviceWorker, /tamafit-staff-calendar-v\d+/);
});
