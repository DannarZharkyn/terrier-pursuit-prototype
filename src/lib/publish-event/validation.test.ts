import test from "node:test";
import assert from "node:assert/strict";
import { validatePublishEventRequest } from "./validation";

const validEvent = {
  name: "Spring Campus Chase",
  startsAt: "2026-07-21T10:00",
  submissionDeadline: "2026-07-21T13:00",
  rules: "Stay with your team.",
  disclaimer: "I understand and accept the participant disclaimer.",
};

const validParticipant = {
  firstName: "Liam",
  lastName: "Brown",
  email: "liam@example.com",
  normalizedFirstName: "liam",
  normalizedLastName: "brown",
  normalizedEmail: "liam@example.com",
};

const validLocation = {
  position: 1,
  landmark: "BU Bridge",
  normalizedLandmark: "bu bridge",
  locationUrl: "https://maps.example.com/bu-bridge",
  clue: "Find the bridge.",
  campusPopulation: "CRC",
};

test("validatePublishEventRequest requires all organizer event fields", () => {
  const result = validatePublishEventRequest({
    event: {
      name: "",
      startsAt: "",
      submissionDeadline: "",
      rules: "",
      disclaimer: "",
    },
    participants: [validParticipant],
    locations: [validLocation],
  });

  assert.deepEqual(result.errors.slice(0, 4), [
    "Event start time is required.",
    "Submission deadline is required.",
    "Event name is required.",
    "Rules are required.",
  ]);
});

test("validatePublishEventRequest stores event dates as ISO strings", () => {
  const result = validatePublishEventRequest({
    event: validEvent,
    participants: [validParticipant],
    locations: [validLocation],
  });

  assert.deepEqual(result.errors, []);
  assert.match(result.data?.event.startsAt ?? "", /T/);
  assert.match(result.data?.event.submissionDeadline ?? "", /T/);
  assert.equal(result.data?.event.rules, "Stay with your team.");
  assert.equal(
    result.data?.event.disclaimer,
    "I understand and accept the participant disclaimer.",
  );
});
