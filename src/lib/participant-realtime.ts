export const participantRulesChangedEvent = "terrier-pursuit:rules-changed";
export const participantTeamChangedEvent = "terrier-pursuit:team-changed";

export function notifyParticipantRulesChanged() {
  window.dispatchEvent(new Event(participantRulesChangedEvent));
}

export function notifyParticipantTeamChanged() {
  window.dispatchEvent(new Event(participantTeamChangedEvent));
}
