import { teamCodeCharacters, teamCodeLength } from "./validation";

export function generateTeamCode() {
  let code = "";

  for (let index = 0; index < teamCodeLength; index += 1) {
    code += teamCodeCharacters[Math.floor(Math.random() * teamCodeCharacters.length)];
  }

  return code;
}
