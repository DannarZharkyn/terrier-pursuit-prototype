import test from "node:test";
import assert from "node:assert/strict";
import { validateParticipantTeamRequest } from "./validation";

const eventId = "11111111-1111-4111-8111-111111111111";
const participantId = "22222222-2222-4222-8222-222222222222";

test("validateParticipantTeamRequest accepts valid IDs", () => {
  const result = validateParticipantTeamRequest({ eventId, participantId });

  assert.deepEqual(result.errors, []);
  assert.equal(result.data?.eventId, eventId);
  assert.equal(result.data?.participantId, participantId);
});

test("validateParticipantTeamRequest rejects missing or invalid IDs", () => {
  const result = validateParticipantTeamRequest({
    eventId: "not-a-uuid",
    participantId: "",
  });

  assert.deepEqual(result.errors, [
    "Event ID must be a valid UUID.",
    "Participant ID is required.",
  ]);
});
