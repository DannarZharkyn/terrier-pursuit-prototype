export type ParticipantJoinCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  normalized_first_name: string | null;
  normalized_last_name: string | null;
  normalized_email: string | null;
  events:
    | {
        id: string;
        name: string;
        game_code: string | null;
        status: string;
        starts_at: string | null;
        submission_deadline: string | null;
        rules: string | null;
      }
    | {
        id: string;
        name: string;
        game_code: string | null;
        status: string;
        starts_at: string | null;
        submission_deadline: string | null;
        rules: string | null;
      }[]
    | null;
};

export type NormalizedParticipantJoinInput = {
  normalizedFirstName: string;
  normalizedLastName: string;
  normalizedEmail: string;
  normalizedGameCode: string;
};

export type ParticipantJoinMatch = {
  participant: ParticipantJoinCandidate;
  event: {
    id: string;
    name: string;
    game_code: string | null;
    status: string;
    starts_at: string | null;
    submission_deadline: string | null;
    rules: string | null;
  };
};

export function findParticipantJoinMatches(
  candidates: ParticipantJoinCandidate[],
  input: NormalizedParticipantJoinInput,
): ParticipantJoinMatch[] {
  const matches: ParticipantJoinMatch[] = [];

  candidates
    .map((candidate) => ({
      participant: candidate,
      event: normalizeJoinedEvent(candidate.events),
    }))
    .forEach(({ participant, event }) => {
      if (!event || event.status !== "published") {
        return;
      }

      const isMatch =
        normalizeDatabaseText(participant.normalized_first_name) ===
          input.normalizedFirstName &&
        normalizeDatabaseText(participant.normalized_last_name) ===
          input.normalizedLastName &&
        normalizeDatabaseText(participant.normalized_email) ===
          input.normalizedEmail &&
        normalizeGameCode(event.game_code) === input.normalizedGameCode;

      if (isMatch) {
        matches.push({ participant, event });
      }
    });

  return matches;
}

function normalizeJoinedEvent(event: ParticipantJoinCandidate["events"]) {
  if (Array.isArray(event)) {
    return event[0];
  }

  return event ?? undefined;
}

function normalizeDatabaseText(value: string | null) {
  return collapseWhitespace(value ?? "").toLowerCase();
}

function normalizeGameCode(value: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
