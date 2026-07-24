import assert from "node:assert/strict";
import test from "node:test";
import { createEventInvitationEmail } from "./event-invitation";

test("createEventInvitationEmail includes event details and escapes HTML", () => {
  const email = createEventInvitationEmail({
    firstName: "<Dannar>",
    eventName: "Test & Play",
    gameCode: "ABC234",
    startsAt: "2026-07-30T14:00:00.000Z",
    participantUrl: "https://example.com/participant/welcome",
  });

  assert.match(email.subject, /Test & Play/);
  assert.match(email.text, /ABC234/);
  assert.match(email.html, /&lt;Dannar&gt;/);
  assert.match(email.html, /Test &amp; Play/);
  assert.doesNotMatch(email.html, /<Dannar>/);
});
