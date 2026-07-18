import type { ParticipantJoinSuccess } from "@/lib/participant-join/types";

const participantSessionKey = "terrier-pursuit.participant-session";

export type ParticipantSession = {
  participant: ParticipantJoinSuccess["participant"];
  event: ParticipantJoinSuccess["event"];
  joinedAt: string;
};

export function saveParticipantSession(join: ParticipantJoinSuccess) {
  const session: ParticipantSession = {
    participant: join.participant,
    event: join.event,
    joinedAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(participantSessionKey, JSON.stringify(session));
}

export function readParticipantSession() {
  const value = window.sessionStorage.getItem(participantSessionKey);

  if (!value) {
    return undefined;
  }

  try {
    const session = JSON.parse(value) as Partial<ParticipantSession>;

    if (
      !session.participant?.id ||
      !session.participant.firstName ||
      !session.participant.lastName ||
      !session.participant.email ||
      !session.event?.id ||
      !session.event.name ||
      !session.event.gameCode
    ) {
      return undefined;
    }

    return session as ParticipantSession;
  } catch {
    return undefined;
  }
}

export function clearParticipantSession() {
  window.sessionStorage.removeItem(participantSessionKey);
}
