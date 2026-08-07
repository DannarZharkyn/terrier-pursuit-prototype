import assert from "node:assert/strict";
import test from "node:test";
import { createEventInvitationEmail, replaceEventInvitationUrl } from "./event-invitation";

test("createEventInvitationEmail includes all participant instructions", () => {
  const email = createEventInvitationEmail({
    eventName: "Test & Play",
    gameCode: "ABC234",
    startsAt: "2026-07-30T14:00:00.000Z",
    submissionDeadline: "2026-07-30T18:00:00.000Z",
    rules: "Stay together.",
    participantUrl: "https://example.com/participant/welcome?gameCode=ABC234",
  });

  assert.match(email.subject, /Test & Play/);
  assert.match(email.body, /Dear Participant/);
  assert.match(email.body, /ABC234/);
  assert.match(email.body, /Stay together/);
  assert.match(email.body, /gameCode=ABC234/);
});

test("replaceEventInvitationUrl keeps saved email text and updates its event link", () => {
  const body = "Welcome!\n\nSign in here: https://old.example/link\n\nGood luck!";

  assert.equal(
    replaceEventInvitationUrl(
      body,
      "https://example.com/participant/welcome?gameCode=ABC234&event=event-id",
    ),
    "Welcome!\n\nSign in here: https://example.com/participant/welcome?gameCode=ABC234&event=event-id\n\nGood luck!",
  );
});
