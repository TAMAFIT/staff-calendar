import test from "node:test";
import assert from "node:assert/strict";
import { withStartupPriority } from "../src/services/startup-priority-calendar-repository.js";

function idleWindow(hash = "#/month/2026-08") {
  const tasks = [];
  return {
    location: { hash },
    tasks,
    requestIdleCallback(callback) {
      tasks.push(callback);
      return tasks.length;
    },
    cancelIdleCallback(id) {
      tasks[id - 1] = null;
    }
  };
}

function repositoryStub() {
  const calls = [];
  return {
    calls,
    getCachedEvents() { return { events: ["cached"] }; },
    getCachedHistory() { return ["cached-history"]; },
    async refreshEvents(startDate, endDate) {
      calls.push(["events", startDate, endDate]);
      return ["fresh"];
    },
    async refreshHistory() {
      calls.push(["history"]);
      return ["fresh-history"];
    }
  };
}

test("visible calendar reads stay immediate while the broad startup prefetch waits for idle time", async () => {
  const target = repositoryStub();
  const windowRef = idleWindow();
  const repository = withStartupPriority(target, { windowRef });

  await repository.refreshEvents("2026-08-01", "2026-08-31");
  assert.deepEqual(target.calls, [["events", "2026-08-01", "2026-08-31"]]);

  const cached = await repository.refreshEvents("2026-05-01", "2027-02-01");
  assert.deepEqual(cached, ["cached"]);
  assert.equal(target.calls.length, 1);
  assert.equal(windowRef.tasks.length, 1);

  await windowRef.tasks[0]();
  assert.equal(target.calls.length, 2);
  assert.deepEqual(target.calls[1], ["events", "2026-05-01", "2027-02-01"]);
});

test("startup history refresh is deferred, but opening history cancels the wait and refreshes immediately", async () => {
  const target = repositoryStub();
  const windowRef = idleWindow();
  const repository = withStartupPriority(target, { windowRef });

  const cached = await repository.refreshHistory();
  assert.deepEqual(cached, ["cached-history"]);
  assert.deepEqual(target.calls, []);
  assert.equal(windowRef.tasks.length, 1);

  windowRef.location.hash = "#/history";
  await repository.refreshHistory();
  assert.deepEqual(target.calls, [["history"]]);
  assert.equal(windowRef.tasks[0], null);
});
