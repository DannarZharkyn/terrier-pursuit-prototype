import assert from "node:assert/strict";
import test from "node:test";
import { createEventParticipantUrl } from "./participant-url";

test("createEventParticipantUrl adds a normalized game code", () => {
  assert.equal(
    createEventParticipantUrl("https://example.com/other/path", " ab2cd3 "),
    "https://example.com/participant/welcome?gameCode=AB2CD3",
  );
});

test("createEventParticipantUrl can bind the link to a specific event", () => {
  assert.equal(
    createEventParticipantUrl(
      "https://example.com",
      "ABC234",
      "bf1e0055-545f-4a8f-a526-15f5b24b01c6",
    ),
    "https://example.com/participant/welcome?gameCode=ABC234&event=bf1e0055-545f-4a8f-a526-15f5b24b01c6",
  );
});
