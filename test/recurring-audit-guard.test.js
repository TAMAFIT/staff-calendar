import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gas = readFileSync(new URL("../gas/Code.gs", import.meta.url), "utf8");

test("GAS marks recurring CalendarEvent instances explicitly", () => {
  assert.match(gas, /isRecurring:\s*event\.isRecurringEvent\(\)/);
});

test("direct-change audit ignores recurring series and removes legacy snapshots", () => {
  assert.match(gas, /if \(event\.isRecurring\) \{\s*staffDeleteSnapshot_\(event\.id, properties\);\s*return;/s);
  assert.match(gas, /if \(moved\.isRecurring\) \{\s*staffDeleteSnapshot_\(previous\.id, properties\);\s*return;/s);
});
