export type ParticipantTeamRequest = {
  eventId: string;
  participantId: string;
  requestedAt: string;
};

export type ParticipantTeamRequestBody = {
  eventId: string;
  participantId: string;
};

export type ParticipantTeamRequestSuccess = {
  ok: true;
  request: ParticipantTeamRequest | null;
};

export type ParticipantTeamRequestFailure = {
  ok: false;
  error: string;
  details?: string[];
};

export type ParticipantTeamRequestResponse =
  | ParticipantTeamRequestSuccess
  | ParticipantTeamRequestFailure;
