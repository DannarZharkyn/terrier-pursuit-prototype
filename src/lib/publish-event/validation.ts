import type { PublishEventRequest } from "./types";

export function validatePublishEventRequest(body: unknown): {
  data?: PublishEventRequest;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return { errors: ["Request body must be an object."] };
  }

  const event = isRecord(body.event) ? body.event : undefined;
  const participants = Array.isArray(body.participants) ? body.participants : undefined;
  const locations = Array.isArray(body.locations) ? body.locations : undefined;

  if (!event) {
    errors.push("Event details are required.");
  }

  if (!participants || participants.length === 0) {
    errors.push("At least one participant is required.");
  }

  if (!locations || locations.length === 0) {
    errors.push("At least one location is required.");
  }

  if (!event || !participants || !locations) {
    return { errors };
  }

  const normalizedEvent = {
    name: stringValue(event.name).trim(),
    startsAt: requiredDateString(event.startsAt, "Event start time", errors),
    submissionDeadline: requiredDateString(
      event.submissionDeadline,
      "Submission deadline",
      errors,
    ),
    rules: stringValue(event.rules).trim(),
  };

  if (!normalizedEvent.name) {
    errors.push("Event name is required.");
  }

  if (!normalizedEvent.rules) {
    errors.push("Rules are required.");
  }

  const normalizedParticipants = participants.map((participant, index) => {
    const rowLabel = `Participant ${index + 1}`;
    const value = isRecord(participant) ? participant : {};
    const normalizedEmail = stringValue(value.normalizedEmail).trim().toLowerCase();

    if (!stringValue(value.firstName).trim()) {
      errors.push(`${rowLabel}: firstName is required.`);
    }

    if (!stringValue(value.lastName).trim()) {
      errors.push(`${rowLabel}: lastName is required.`);
    }

    if (!stringValue(value.email).trim()) {
      errors.push(`${rowLabel}: email is required.`);
    }

    if (!normalizedEmail) {
      errors.push(`${rowLabel}: normalizedEmail is required.`);
    } else if (normalizedEmail !== stringValue(value.normalizedEmail).trim()) {
      errors.push(`${rowLabel}: normalizedEmail must be lowercase.`);
    } else if (!isValidEmail(normalizedEmail)) {
      errors.push(`${rowLabel}: normalizedEmail must be a valid email address.`);
    }

    return {
      firstName: collapseWhitespace(stringValue(value.firstName)),
      lastName: collapseWhitespace(stringValue(value.lastName)),
      email: stringValue(value.email).trim(),
      normalizedFirstName: collapseWhitespace(stringValue(value.normalizedFirstName)).toLowerCase(),
      normalizedLastName: collapseWhitespace(stringValue(value.normalizedLastName)).toLowerCase(),
      normalizedEmail,
    };
  });

  const participantEmails = new Set<string>();
  normalizedParticipants.forEach((participant) => {
    if (participantEmails.has(participant.normalizedEmail)) {
      errors.push(`Duplicate participant email: ${participant.normalizedEmail}.`);
    }
    participantEmails.add(participant.normalizedEmail);
  });

  const normalizedLocations = locations.map((location, index) => {
    const rowLabel = `Location ${index + 1}`;
    const value = isRecord(location) ? location : {};
    const position = Number(value.position);
    const locationUrl = stringValue(value.locationUrl).trim();

    if (!Number.isInteger(position) || position < 1) {
      errors.push(`${rowLabel}: position must be a positive integer.`);
    }

    if (!stringValue(value.landmark).trim()) {
      errors.push(`${rowLabel}: landmark is required.`);
    }

    if (!stringValue(value.normalizedLandmark).trim()) {
      errors.push(`${rowLabel}: normalizedLandmark is required.`);
    }

    if (!locationUrl) {
      errors.push(`${rowLabel}: locationUrl is required.`);
    } else if (!isValidHttpsUrl(locationUrl)) {
      errors.push(`${rowLabel}: locationUrl must be a valid https URL.`);
    }

    if (!stringValue(value.clue).trim()) {
      errors.push(`${rowLabel}: clue is required.`);
    }

    if (!stringValue(value.campusPopulation).trim()) {
      errors.push(`${rowLabel}: campusPopulation is required.`);
    }

    return {
      position,
      landmark: collapseWhitespace(stringValue(value.landmark)),
      normalizedLandmark: collapseWhitespace(stringValue(value.normalizedLandmark)).toLowerCase(),
      locationUrl,
      clue: collapseWhitespace(stringValue(value.clue)),
      campusPopulation: collapseWhitespace(stringValue(value.campusPopulation)),
    };
  });

  const positions = new Set<number>();
  const landmarks = new Set<string>();
  normalizedLocations.forEach((location) => {
    if (positions.has(location.position)) {
      errors.push(`Duplicate location position: ${location.position}.`);
    }
    positions.add(location.position);

    if (landmarks.has(location.normalizedLandmark)) {
      errors.push(`Duplicate landmark: ${location.normalizedLandmark}.`);
    }
    landmarks.add(location.normalizedLandmark);
  });

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      event: normalizedEvent,
      participants: normalizedParticipants,
      locations: normalizedLocations,
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

function requiredDateString(value: unknown, field: string, errors: string[]) {
  const text = stringValue(value).trim();

  if (!text) {
    errors.push(`${field} is required.`);
    return "";
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    errors.push(`${field} must be a valid date.`);
    return "";
  }

  return date.toISOString();
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

function isValidHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
