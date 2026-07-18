import type { ParticipantJoinRequest } from "./types";

export function validateParticipantJoinRequest(body: unknown): {
  data?: ParticipantJoinRequest & {
    normalizedFirstName: string;
    normalizedLastName: string;
    normalizedEmail: string;
    normalizedGameCode: string;
  };
  errors: string[];
} {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return { errors: ["Request body must be an object."] };
  }

  const firstName = collapseWhitespace(stringValue(body.firstName));
  const lastName = collapseWhitespace(stringValue(body.lastName));
  const email = stringValue(body.email).trim();
  const gameCode = stringValue(body.gameCode).trim();
  const normalizedEmail = email.toLowerCase();
  const normalizedGameCode = gameCode.toUpperCase();

  if (!firstName) {
    errors.push("First name is required.");
  }

  if (!lastName) {
    errors.push("Last name is required.");
  }

  if (!email) {
    errors.push("Email is required.");
  } else if (!isValidEmail(normalizedEmail)) {
    errors.push("Email must be a valid email address.");
  }

  if (!gameCode) {
    errors.push("Game code is required.");
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      firstName,
      lastName,
      email,
      gameCode,
      normalizedFirstName: firstName.toLowerCase(),
      normalizedLastName: lastName.toLowerCase(),
      normalizedEmail,
      normalizedGameCode,
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

function isValidEmail(email: string) {
  if (email.includes(" ")) {
    return false;
  }

  const parts = email.split("@");

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  return Boolean(localPart && domain && domain.includes("."));
}
