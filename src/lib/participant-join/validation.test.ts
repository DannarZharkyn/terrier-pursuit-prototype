import test from "node:test";
import assert from "node:assert/strict";
import { validateParticipantJoinRequest } from "./validation";

test("validateParticipantJoinRequest normalizes a valid request", () => {
  const result = validateParticipantJoinRequest({
    firstName: "  Dannar  ",
    lastName: "  ZHAR KYN  ",
    email: "  Dannar@Example.COM  ",
    gameCode: "  ab12cd  ",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.data?.firstName, "Dannar");
  assert.equal(result.data?.lastName, "ZHAR KYN");
  assert.equal(result.data?.email, "Dannar@Example.COM");
  assert.equal(result.data?.gameCode, "ab12cd");
  assert.equal(result.data?.normalizedFirstName, "dannar");
  assert.equal(result.data?.normalizedLastName, "zhar kyn");
  assert.equal(result.data?.normalizedEmail, "dannar@example.com");
  assert.equal(result.data?.normalizedGameCode, "AB12CD");
});

test("validateParticipantJoinRequest requires all fields", () => {
  const result = validateParticipantJoinRequest({});

  assert.deepEqual(result.errors, [
    "First name is required.",
    "Last name is required.",
    "Email is required.",
    "Game code is required.",
  ]);
});

test("validateParticipantJoinRequest rejects invalid email", () => {
  const result = validateParticipantJoinRequest({
    firstName: "Dannar",
    lastName: "Zharkyn",
    email: "not-an-email",
    gameCode: "ABC123",
  });

  assert.deepEqual(result.errors, ["Email must be a valid email address."]);
});

test("validateParticipantJoinRequest rejects non-object bodies", () => {
  const result = validateParticipantJoinRequest(null);

  assert.deepEqual(result.errors, ["Request body must be an object."]);
});
