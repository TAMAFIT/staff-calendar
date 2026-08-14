import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mainEntry = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const serviceWorker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");

test("the single production entry initializes swipe before the calendar app", () => {
  const swipeIndex = mainEntry.indexOf('./calendar-swipe.js');
  const appIndex = mainEntry.indexOf('./local-first-app.js');

  assert.notEqual(swipeIndex, -1);
  assert.notEqual(appIndex, -1);
  assert.ok(swipeIndex < appIndex, "calendar-swipe.js must execute before local-first-app.js");
  assert.match(indexHtml, /\.\/app\.bundle\.js/);
  assert.doesNotMatch(indexHtml, /\.\/src\/calendar-swipe\.js/);
  assert.doesNotMatch(indexHtml, /\.\/src\/local-first-app\.js/);
});

test("installed navigation, scripts and styles start cached-first and refresh in background", () => {
  assert.match(serviceWorker, /function cachedNavigation\(/);
  assert.match(serviceWorker, /event\.respondWith\(cachedNavigation\(request, event\)\)/);
  assert.match(serviceWorker, /function cachedFirstAndRefresh\(/);
  assert.match(serviceWorker, /request\.destination === "script" \|\| request\.destination === "style"/);
  assert.match(serviceWorker, /event\.respondWith\(cachedFirstAndRefresh\(request, event\)\)/);
  assert.match(serviceWorker, /tamafit-staff-calendar-v\d+/);
});
