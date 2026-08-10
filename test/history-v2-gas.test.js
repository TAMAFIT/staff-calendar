import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../gas/Code.gs", import.meta.url), "utf8");

test("GAS mutation handlers pass mutationId into canonical audit writes", () => {
  assert.match(source, /staffCreateEvent_\(data\.event \|\| \{\}, data\.operatorId, data\.mutationId\)/);
  assert.match(source, /staffUpdateEvent_\(data\.id, data\.event \|\| \{\}, data\.operatorId, data\.mutationId\)/);
  assert.match(source, /staffDeleteEvent_\(data\.id, data\.operatorId, data\.mutationId\)/);
  assert.match(source, /mutationId:\s*staffAuditText_\(mutationId, 220\)/);
});

test("GAS mutation responses return the canonical history record", () => {
  assert.match(source, /status:\s*"success", event: result\.event, history: result\.history/);
  assert.match(source, /status:\s*"success", history: staffDeleteEvent_/);
  assert.match(source, /historyId:\s*staffAuditHistoryId_\(key\)/);
});

test("history deletion distinguishes deleted from safely acknowledged ids", () => {
  assert.match(source, /const acknowledged = \[\]/);
  assert.match(source, /acknowledged\.push\(id\)/);
  assert.match(source, /return \{ deleted: deleted, acknowledged: acknowledged \}/);
});
