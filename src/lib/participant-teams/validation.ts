import type {
  CreateTeamRequest,
  CurrentTeamRequest,
  DeleteTeamRequest,
  JoinTeamRequest,
} from "./types";

export const teamCodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const teamCodeLength = 6;

export function validateCreateTeamRequest(body: unknown): {
  data?: CreateTeamRequest & {
    normalizedTeamName: string;
  };
  errors: string[];
} {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return { errors: ["Request body must be an object."] };
  }

  const eventId = stringValue(body.eventId).trim();
  const participantId = stringValue(body.participantId).trim();
  const teamName = collapseWhitespace(stringValue(body.teamName));
  const normalizedTeamName = teamName.toLowerCase();

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

  if (!teamName) {
    errors.push("Team name is required.");
  } else if (teamName.length > 80) {
    errors.push("Team name must be 80 characters or fewer.");
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      eventId,
      participantId,
      teamName,
      normalizedTeamName,
    },
    errors: [],
  };
}

export function validateDeleteTeamRequest(body: unknown): {
  data?: DeleteTeamRequest;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return { errors: ["Request body must be an object."] };
  }

  const participantId = stringValue(body.participantId).trim();

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
      participantId,
    },
    errors: [],
  };
}

export function validateJoinTeamRequest(body: unknown): {
  data?: JoinTeamRequest;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return { errors: ["Request body must be an object."] };
  }

  const eventId = stringValue(body.eventId).trim();
  const participantId = stringValue(body.participantId).trim();
  const teamCode = stringValue(body.teamCode).trim().toUpperCase();

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

  if (!teamCode) {
    errors.push("Team code is required.");
  } else if (
    teamCode.length !== teamCodeLength ||
    ![...teamCode].every((character) => teamCodeCharacters.includes(character))
  ) {
    errors.push("Team code must be a valid 6-character team code.");
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      eventId,
      participantId,
      teamCode,
    },
    errors: [],
  };
}

export function validateCurrentTeamRequest(values: {
  eventId: string | null;
  participantId: string | null;
}): {
  data?: CurrentTeamRequest;
  errors: string[];
} {
  const errors: string[] = [];
  const eventId = (values.eventId ?? "").trim();
  const participantId = (values.participantId ?? "").trim();

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
