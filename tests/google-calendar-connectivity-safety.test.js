import test from "node:test";
import assert from "node:assert/strict";
import { GoogleCalendarRepository } from "../src/services/google-calendar-repository.js";

const endpoint = "https://script.google.com/macros/s/test-deployment/exec";
const jsonResponse = (payload) => new Response(JSON.stringify(payload), {status: 200});

test("HTTP 403 mutation is uncertain and retryable without changing mutation ID", async () => {
  const bodies = [];
  const repository = new GoogleCalendarRepository({endpoint,
    fetchImpl: async (_url, options) => {
      bodies.push(options.body);
      return new Response("Forbidden", {status: 403});
    }
  });
  await assert.rejects(
    () => repository.createEvent({customerName: "保護テスト"}, {mutationId: "mutation-403"}),
    (error) => error.retryable === true && /HTTP 403/.test(error.message)
  );
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0], bodies[1]);
  assert.equal(JSON.parse(bodies[0]).mutationId, "mutation-403");
});

test("unknown GAS error after mutation does not prove booking failed", async () => {
  const repository = new GoogleCalendarRepository({endpoint,
    fetchImpl: async () => jsonResponse({status: "error", message: "Google Calendar service temporarily unavailable"})
  });
  await assert.rejects(
    () => repository.createEvent({customerName: "保護テスト"}, {mutationId: "mutation-server-unknown"}),
    (error) => error.retryable === true
  );
});

test("definitive booking conflict stays non-retryable", async () => {
  let attempts = 0;
  const repository = new GoogleCalendarRepository({endpoint,
    fetchImpl: async () => {
      attempts++;
      return jsonResponse({status: "error", message: "同じ担当トレーナーに重複する予約があります。"});
    }
  });
  await assert.rejects(
    () => repository.createEvent({customerName: "保護テスト"}, {mutationId: "mutation-conflict"}),
    (error) => error.retryable === false
  );
  assert.equal(attempts, 1);
});

test("explicit GAS retryable=false overrides unknown error fallback", async () => {
  const repository = new GoogleCalendarRepository({endpoint,
    fetchImpl: async () => jsonResponse({status: "error", message: "not allowed", retryable: false, code: "DENIED"})
  });
  await assert.rejects(
    () => repository.deleteEvent("event-1", {mutationId: "mutation-denied"}),
    (error) => error.retryable === false && error.code === "DENIED"
  );
});

test("known validation rejection is not retried", async () => {
  const repository = new GoogleCalendarRepository({endpoint,
    fetchImpl: async () => jsonResponse({status: "error", message: "所要時間を確認してください。"})
  });
  await assert.rejects(
    () => repository.createEvent({customerName: "保護テスト"}, {mutationId: "mutation-validation"}),
    (error) => error.retryable === false
  );
});

test("response loss and recovered success reuse the same mutation ID", async () => {
  const ids = [];
  const repository = new GoogleCalendarRepository({endpoint,
    fetchImpl: async (_url, options) => {
      ids.push(JSON.parse(options.body).mutationId);
      if (ids.length === 1) throw new TypeError("fetch failed");
      return jsonResponse({status: "success", event: {id: "calendar-one"}});
    }
  });
  assert.equal((await repository.createEvent({customerName: "保護テスト"}, {mutationId: "mutation-recover"})).id, "calendar-one");
  assert.deepEqual(ids, ["mutation-recover", "mutation-recover"]);
});
