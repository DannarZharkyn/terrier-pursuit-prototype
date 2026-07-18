export type ParticipantJoinRequest = {
  firstName: string;
  lastName: string;
  email: string;
  gameCode: string;
};

export type ParticipantJoinSuccess = {
  ok: true;
  participant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
    gameCode: string;
    startsAt: string;
    submissionDeadline: string;
    rules: string;
  };
};

export type ParticipantJoinFailure = {
  ok: false;
  error: string;
  details?: string[];
};

export type ParticipantJoinResponse =
  | ParticipantJoinSuccess
  | ParticipantJoinFailure;
