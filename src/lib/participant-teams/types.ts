export type CreateTeamRequest = {
  eventId: string;
  participantId: string;
  teamName: string;
};

export type CurrentTeamRequest = {
  eventId: string;
  participantId: string;
};

export type JoinTeamRequest = {
  eventId: string;
  participantId: string;
  teamCode: string;
};

export type DeleteTeamRequest = {
  participantId: string;
};

export type RemoveTeamMemberRequest = {
  removerParticipantId: string;
  removedParticipantId: string;
  reason: "did_not_show_up" | "other";
  explanation: string;
  attested: boolean;
};

export type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type ParticipantTeam = {
  id: string;
  name: string;
  teamCode: string;
  members: TeamMember[];
};

export type CreateTeamSuccess = {
  ok: true;
  team: ParticipantTeam;
};

export type CurrentTeamSuccess = {
  ok: true;
  team: ParticipantTeam | null;
};

export type JoinTeamSuccess = {
  ok: true;
  team: ParticipantTeam;
};

export type DeleteTeamSuccess = {
  ok: true;
  leftTeamId: string;
  teamDeleted: boolean;
};

export type RemoveTeamMemberSuccess = {
  ok: true;
  removedParticipantId: string;
};

export type TeamApiFailure = {
  ok: false;
  error: string;
  details?: string[];
};

export type CreateTeamResponse = CreateTeamSuccess | TeamApiFailure;

export type CurrentTeamResponse = CurrentTeamSuccess | TeamApiFailure;

export type JoinTeamResponse = JoinTeamSuccess | TeamApiFailure;

export type DeleteTeamResponse = DeleteTeamSuccess | TeamApiFailure;

export type RemoveTeamMemberResponse = RemoveTeamMemberSuccess | TeamApiFailure;
