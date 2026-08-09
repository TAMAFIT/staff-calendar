import test from "node:test";
import assert from "node:assert/strict";
import { completionMessage } from "../src/action-feedback.js";

test("completion feedback uses short reassuring labels", () => {
  assert.equal(completionMessage("create"), "予約完了");
  assert.equal(completionMessage("update"), "変更完了");
  assert.equal(completionMessage("delete"), "削除完了");
});
