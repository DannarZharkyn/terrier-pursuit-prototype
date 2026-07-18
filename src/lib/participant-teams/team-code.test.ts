import test from "node:test";
import assert from "node:assert/strict";
import { generateTeamCode } from "./team-code";
import { teamCodeCharacters, teamCodeLength } from "./validation";

test("generateTeamCode returns a six-character friendly code", () => {
  const code = generateTeamCode();

  assert.equal(code.length, teamCodeLength);

  for (const character of code) {
    assert.equal(teamCodeCharacters.includes(character), true);
  }
});
