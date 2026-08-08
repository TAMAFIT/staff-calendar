import test from "node:test";
import assert from "node:assert/strict";

import { GoogleCalendarRepository } from "../src/services/google-calendar-repository.js";

const endpoint = "https://script.google.com/macros/s/test-deployment/exec";

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

test("listEvents calls the deployed Apps Script with the requested range", async () => {
  let requestUrl = "";
  const repository = new GoogleCalendarRepository({
    endpoint,
    fetchImpl: async (url) => {
      requestUrl = String(url);
      return jsonResponse({ status: "success", events: [{ id: "event-1" }] });
    }
  });

  const events = await repository.listEvents("2026-08-01", "2026-08-31");
  const url = new URL(requestUrl);
  assert.equal(url.searchParams.get("action"), "staffCalendarList");
  assert.equal(url.searchParams.get("startDate"), "2026-08-01");
  assert.equal(url.searchParams.get("endDate"), "2026-08-31");
  assert.deepEqual(events, [{ id: "event-1" }]);
});

test("createEvent sends a CORS-simple POST payload to Apps Script", async () => {
  let request = null;
  const repository = new GoogleCalendarRepository({
    endpoint,
    fetchImpl: async (url, options) => {
      request = { url: String(url), options };
      return jsonResponse({ status: "success", event: { id: "event-2" } });
    }
  });

  const event = await repository.createEvent({ customerName: "テスト 太郎" });
  assert.equal(request.url, endpoint);
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers, undefined);
  assert.deepEqual(JSON.parse(request.options.body), {
    action: "staffCalendarCreate",
    operatorId: "",
    event: { customerName: "テスト 太郎" }
  });
  assert.deepEqual(event, { id: "event-2" });
});

test("an API error becomes a readable application error", async () => {
  const repository = new GoogleCalendarRepository({
    endpoint,
    fetchImpl: async () => jsonResponse({ status: "error", message: "予約が見つかりませんでした。" })
  });

  await assert.rejects(() => repository.getEvent("missing"), /予約が見つかりませんでした/);
});

test("listHistory requests the latest audit entries", async () => {
  let requestUrl = "";
  const repository = new GoogleCalendarRepository({
    endpoint,
    fetchImpl: async (url) => {
      requestUrl = String(url);
      return jsonResponse({ status: "success", entries: [{ action: "作成" }] });
    }
  });

  assert.deepEqual(await repository.listHistory(25), [{ action: "作成" }]);
  const url = new URL(requestUrl);
  assert.equal(url.searchParams.get("action"), "staffCalendarHistory");
  assert.equal(url.searchParams.get("limit"), "25");
});

