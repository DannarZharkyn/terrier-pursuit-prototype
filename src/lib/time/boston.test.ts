import assert from "node:assert/strict";
import test from "node:test";
import {
  formatBostonDateTime,
  getBostonInputValues,
  parseBostonDateTime,
} from "./boston";

test("converts Boston summer time to UTC using daylight time", () => {
  assert.equal(parseBostonDateTime("2026-08-09", "17:40"), "2026-08-09T21:40:00.000Z");
  assert.match(formatBostonDateTime("2026-08-09T21:40:00.000Z"), /5:40 PM EDT/);
});

test("converts Boston winter time to UTC using standard time", () => {
  assert.equal(parseBostonDateTime("2026-12-15", "17:40"), "2026-12-15T22:40:00.000Z");
  assert.match(formatBostonDateTime("2026-12-15T22:40:00.000Z"), /5:40 PM EST/);
});

test("reads form values in Boston time regardless of device timezone", () => {
  assert.deepEqual(getBostonInputValues("2026-08-09T21:40:00.000Z"), {
    date: "2026-08-09",
    time: "17:40",
  });
});

test("rejects a nonexistent clock time during the spring DST change", () => {
  assert.equal(parseBostonDateTime("2026-03-08", "02:30"), "");
});
