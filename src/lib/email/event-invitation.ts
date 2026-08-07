type EventInvitation = {
  eventName: string;
  gameCode: string;
  startsAt: string;
  submissionDeadline: string;
  rules: string;
  participantUrl: string;
};

export function createEventInvitationEmail(invitation: EventInvitation) {
  const startsAt = formatUsDateTime(invitation.startsAt);
  const submissionDeadline = formatUsDateTime(invitation.submissionDeadline);
  const subject = `You're invited to play ${invitation.eventName}`;
  const body = [
    "Dear Participant,",
    "",
    "Welcome to the Terrier Pursuit game!",
    "",
    `Game: ${invitation.eventName}`,
    `Game starts: ${startsAt}`,
    `Submission deadline: ${submissionDeadline}`,
    `Game code: ${invitation.gameCode}`,
    "",
    `Sign in here: ${invitation.participantUrl}`,
    "",
    "Instructions:",
    "1. Open the sign-in link.",
    "2. Enter your first name, last name, and email address. The event link will fill in the game code automatically.",
    "3. Create a team, join an existing team, or wait for the organizer to assign you.",
    "4. Destination clues will become visible when the game starts.",
    "",
    "Game rules:",
    invitation.rules,
    "",
    "Good luck and have fun!",
    "Terrier Pursuit",
  ].join("\n");

  return { subject, body };
}

function formatUsDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}
