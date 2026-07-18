import test from "node:test";
import assert from "node:assert/strict";
import {
  teamCodeCharacters,
  teamCodeLength,
  validateCreateTeamRequest,
  validateCurrentTeamRequest,
  validateDeleteTeamRequest,
  validateJoinTeamRequest,
} from "./validation";

const eventId = "11111111-1111-4111-8111-111111111111";
const participantId = "22222222-2222-4222-8222-222222222222";

test("validateCreateTeamRequest normalizes team names for case-insensitive uniqueness", () => {
  const result = validateCreateTeamRequest({
    eventId,
    participantId,
    teamName: "  Terrier    Squad  ",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.data?.teamName, "Terrier Squad");
  assert.equal(result.data?.normalizedTeamName, "terrier squad");
});

test("validateCreateTeamRequest normalizes uppercase team names", () => {
  const result = validateCreateTeamRequest({
    eventId,
    participantId,
    teamName: "TERRIER SQUAD",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.data?.normalizedTeamName, "terrier squad");
});

test("validateCreateTeamRequest requires valid IDs and a team name", () => {
  const result = validateCreateTeamRequest({
    eventId: "not-a-uuid",
    participantId: "",
    teamName: "",
  });

  assert.deepEqual(result.errors, [
    "Event ID must be a valid UUID.",
    "Participant ID is required.",
    "Team name is required.",
  ]);
});

test("validateCreateTeamRequest rejects long team names", () => {
  const result = validateCreateTeamRequest({
    eventId,
    participantId,
    teamName: "A".repeat(81),
  });

  assert.deepEqual(result.errors, ["Team name must be 80 characters or fewer."]);
});

test("validateDeleteTeamRequest requires a valid participant ID", () => {
  const result = validateDeleteTeamRequest({
    participantId: "not-a-uuid",
  });

  assert.deepEqual(result.errors, ["Participant ID must be a valid UUID."]);
});

test("validateJoinTeamRequest normalizes lowercase team codes", () => {
  const result = validateJoinTeamRequest({
    eventId,
    participantId,
    teamCode: "  abc234  ",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.data?.teamCode, "ABC234");
});

test("validateJoinTeamRequest rejects invalid team codes", () => {
  const result = validateJoinTeamRequest({
    eventId,
    participantId,
    teamCode: "BAD-1",
  });

  assert.deepEqual(result.errors, [
    "Team code must be a valid 6-character team code.",
  ]);
});

test("validateCurrentTeamRequest requires valid event and participant IDs", () => {
  const result = validateCurrentTeamRequest({
    eventId: "not-a-uuid",
    participantId: "",
  });

  assert.deepEqual(result.errors, [
    "Event ID must be a valid UUID.",
    "Participant ID is required.",
  ]);
});

test("validateCurrentTeamRequest accepts valid event and participant IDs", () => {
  const result = validateCurrentTeamRequest({
    eventId,
    participantId,
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.data?.eventId, eventId);
  assert.equal(result.data?.participantId, participantId);
});

test("validateDeleteTeamRequest accepts a valid participant ID", () => {
  const result = validateDeleteTeamRequest({
    participantId,
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.data?.participantId, participantId);
});

test("team code contract uses six friendly uppercase characters", () => {
  assert.equal(teamCodeLength, 6);
  assert.match(teamCodeCharacters, /^[A-Z2-9]+$/);
  assert.equal(teamCodeCharacters.includes("I"), false);
  assert.equal(teamCodeCharacters.includes("O"), false);
  assert.equal(teamCodeCharacters.includes("1"), false);
  assert.equal(teamCodeCharacters.includes("0"), false);
});
