import assert from "node:assert/strict";
import test from "node:test";
import { hasEventStarted } from "./start-state";

test("event clues stay locked before a valid start time", () => {
  const now = Date.parse("2026-08-29T16:00:00.000Z");
  assert.equal(hasEventStarted("2026-08-29T16:00:01.000Z", now), false);
  assert.equal(hasEventStarted("2026-08-29T16:00:00.000Z", now), true);
  assert.equal(hasEventStarted("2026-08-29T15:59:59.000Z", now), true);
  assert.equal(hasEventStarted("not-a-date", now), false);
  assert.equal(hasEventStarted(null, now), false);
});
