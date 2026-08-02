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

export async function refreshParticipantSession(
  currentSession: ParticipantSession = readParticipantSession() as ParticipantSession,
) {
  if (!currentSession) {
    return undefined;
  }

  const response = await fetch("/api/participant/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      firstName: currentSession.participant.firstName,
      lastName: currentSession.participant.lastName,
      email: currentSession.participant.email,
      gameCode: currentSession.event.gameCode,
    }),
  });
  const result = (await response.json()) as ParticipantJoinSuccess | { ok: false };

  if (!result.ok) {
    return undefined;
  }

  saveParticipantSession(result);
  return readParticipantSession();
}
