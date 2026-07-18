import test from "node:test";
import assert from "node:assert/strict";
import {
  findParticipantJoinMatches,
  type NormalizedParticipantJoinInput,
  type ParticipantJoinCandidate,
} from "./matching";

const baseInput: NormalizedParticipantJoinInput = {
  normalizedFirstName: "liam",
  normalizedLastName: "chen",
  normalizedEmail: "liam.chen@example.com",
  normalizedGameCode: "ABC123",
};

function candidate(
  overrides: Partial<ParticipantJoinCandidate> = {},
): ParticipantJoinCandidate {
  return {
    id: "participant-1",
    first_name: "Liam",
    last_name: "Chen",
    email: "Liam.Chen@Example.com",
    normalized_first_name: "Liam",
    normalized_last_name: "Chen",
    normalized_email: "Liam.Chen@Example.com",
    events: {
      id: "event-1",
      name: "Orientation Hunt",
      game_code: "ABC123",
      status: "published",
      starts_at: "2026-07-21T14:00:00.000Z",
      submission_deadline: "2026-07-21T17:00:00.000Z",
      rules: "Stay together.",
    },
    ...overrides,
  };
}

test("findParticipantJoinMatches matches lowercase input against stored mixed-case first name", () => {
  const matches = findParticipantJoinMatches([candidate()], baseInput);

  assert.equal(matches.length, 1);
});

test("findParticipantJoinMatches matches uppercase stored names against lowercase input", () => {
  const matches = findParticipantJoinMatches(
    [
      candidate({
        normalized_first_name: "LIAM",
        normalized_last_name: "CHEN",
      }),
    ],
    baseInput,
  );

  assert.equal(matches.length, 1);
});

test("findParticipantJoinMatches matches mixed-case stored email", () => {
  const matches = findParticipantJoinMatches(
    [candidate({ normalized_email: "LiAm.ChEn@Example.COM" })],
    baseInput,
  );

  assert.equal(matches.length, 1);
});

test("findParticipantJoinMatches matches lowercase stored game code", () => {
  const matches = findParticipantJoinMatches(
    [
      candidate({
        events: {
          id: "event-1",
          name: "Orientation Hunt",
          game_code: "abc123",
          status: "published",
          starts_at: "2026-07-21T14:00:00.000Z",
          submission_deadline: "2026-07-21T17:00:00.000Z",
          rules: "Stay together.",
        },
      }),
    ],
    baseInput,
  );

  assert.equal(matches.length, 1);
});

test("findParticipantJoinMatches matches extra spaces around stored names and email", () => {
  const matches = findParticipantJoinMatches(
    [
      candidate({
        normalized_first_name: "  Liam  ",
        normalized_last_name: "  Chen  ",
        normalized_email: "  Liam.Chen@Example.com  ",
      }),
    ],
    baseInput,
  );

  assert.equal(matches.length, 1);
});
