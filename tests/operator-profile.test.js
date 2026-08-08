import test from "node:test";
import assert from "node:assert/strict";

import { getOperatorProfile, loadOperatorId, saveOperatorId } from "../src/state.js";
import { renderBookingForm } from "../src/views/booking-form-view.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

test("an operator selection is remembered on the device", () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = new MemoryStorage();
  try {
    assert.equal(loadOperatorId(), "");
    assert.equal(saveOperatorId("obayashi"), true);
    assert.equal(loadOperatorId(), "obayashi");
    assert.equal(getOperatorProfile().name, "大林");
    assert.equal(saveOperatorId("unknown"), false);
  } finally {
    globalThis.localStorage = previousStorage;
  }
});

test("the store device starts a new booking with no trainer", () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = new MemoryStorage();
  try {
    saveOperatorId("store");
    const html = renderBookingForm({
      defaultDate: "2026-08-08",
      defaultTrainerId: getOperatorProfile().trainerId
    });
    assert.match(html, /<option value="" selected>指定なし（共通予定）<\/option>/);
    assert.match(html, /<strong>店舗用端末<\/strong>/);
  } finally {
    globalThis.localStorage = previousStorage;
  }
});
