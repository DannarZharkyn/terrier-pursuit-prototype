const verifiedConsentPrefix = "terrier-pursuit.consent-verified";

function consentKey(eventId: string, participantId: string) {
  return `${verifiedConsentPrefix}:${eventId}:${participantId}`;
}

export function hasVerifiedParticipantConsent(eventId: string, participantId: string) {
  return window.sessionStorage.getItem(consentKey(eventId, participantId)) === "true";
}

export function markParticipantConsentVerified(eventId: string, participantId: string) {
  window.sessionStorage.setItem(consentKey(eventId, participantId), "true");
}

export function clearParticipantConsentVerification(eventId: string, participantId: string) {
  window.sessionStorage.removeItem(consentKey(eventId, participantId));
}
