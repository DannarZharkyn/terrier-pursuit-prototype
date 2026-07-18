import type { ParticipantTeamRequestBody } from "./types";

export function validateParticipantTeamRequest(values: {
  eventId: unknown;
  participantId: unknown;
}): {
  data?: ParticipantTeamRequestBody;
  errors: string[];
} {
  const errors: string[] = [];
  const eventId = stringValue(values.eventId).trim();
  const participantId = stringValue(values.participantId).trim();

  if (!eventId) {
    errors.push("Event ID is required.");
  } else if (!isUuid(eventId)) {
    errors.push("Event ID must be a valid UUID.");
  }

  if (!participantId) {
    errors.push("Participant ID is required.");
  } else if (!isUuid(participantId)) {
    errors.push("Participant ID must be a valid UUID.");
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      eventId,
      participantId,
    },
    errors: [],
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
