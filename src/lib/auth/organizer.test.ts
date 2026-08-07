import assert from "node:assert/strict";
import test from "node:test";
import { isApprovedOrganizerEmail } from "./organizer";

test("only the approved organizer email is authorized", () => {
  assert.equal(isApprovedOrganizerEmail("studentwellbeing@bu.edu"), true);
  assert.equal(isApprovedOrganizerEmail(" StudentWellbeing@BU.EDU "), true);
  assert.equal(isApprovedOrganizerEmail("someoneelse@bu.edu"), false);
  assert.equal(isApprovedOrganizerEmail(undefined), false);
});
