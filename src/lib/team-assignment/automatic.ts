export type AutomaticAssignmentMode = "random" | "role_balanced";

export type AssignmentParticipant = {
  id: string;
  role: "leader" | "participant" | null;
  isTeamContact?: boolean;
};

export type AssignmentTeam = {
  id: string;
  name: string;
  memberCount: number;
};

export type AutomaticAssignmentPlan = {
  newTeams: { key: string; name: string }[];
  assignments: { participantId: string; teamKey: string }[];
  teamSizes: Record<string, number>;
};

export function planAutomaticAssignments({
  participants,
  teams,
  mode,
  targetTeamSize,
  random = Math.random,
}: {
  participants: AssignmentParticipant[];
  teams: AssignmentTeam[];
  mode: AutomaticAssignmentMode;
  targetTeamSize: number;
  random?: () => number;
}): AutomaticAssignmentPlan {
  if (!Number.isInteger(targetTeamSize) || targetTeamSize < 2 || targetTeamSize > 20) {
    throw new Error("Target team size must be between 2 and 20.");
  }

  if (!participants.length) {
    throw new Error("There are no unassigned participants.");
  }

  return mode === "role_balanced"
    ? planByRole(participants, teams, targetTeamSize, random)
    : planRandomly(participants, teams, targetTeamSize, random);
}

function planRandomly(
  participants: AssignmentParticipant[],
  teams: AssignmentTeam[],
  targetTeamSize: number,
  random: () => number,
) {
  const existingMembers = teams.reduce((total, team) => total + team.memberCount, 0);
  const desiredTeamCount = Math.max(1, Math.ceil((existingMembers + participants.length) / targetTeamSize));
  const newTeamCount = Math.max(0, desiredTeamCount - teams.length);
  const newTeams = makeNewTeams(newTeamCount, teams.map((team) => team.name));
  const teamSizes = Object.fromEntries([
    ...teams.map((team) => [team.id, team.memberCount] as const),
    ...newTeams.map((team) => [team.key, 0] as const),
  ]);
  const teamKeys = Object.keys(teamSizes);
  const assignments = shuffle(participants, random).map((participant) => {
    const minimumSize = Math.min(...teamKeys.map((key) => teamSizes[key]));
    const leastFullTeams = teamKeys.filter((key) => teamSizes[key] === minimumSize);
    const teamKey = leastFullTeams[Math.floor(random() * leastFullTeams.length)];
    if (!teamKey) throw new Error("Could not find a team for automatic assignment.");
    teamSizes[teamKey] += 1;
    return { participantId: participant.id, teamKey };
  });

  return { newTeams, assignments, teamSizes };
}

function planByRole(
  participants: AssignmentParticipant[],
  teams: AssignmentTeam[],
  targetTeamSize: number,
  random: () => number,
) {
  const preferredLeaders = shuffle(
    participants.filter((participant) => participant.role === "leader"),
    random,
  );
  const designatedContacts = shuffle(
    participants.filter((participant) => participant.role !== "leader" && participant.isTeamContact),
    random,
  );
  const coordinators = [...preferredLeaders, ...designatedContacts];
  const desiredTeamCount = Math.max(1, Math.ceil(participants.length / targetTeamSize));

  if (coordinators.length < desiredTeamCount) {
    const shortage = desiredTeamCount - coordinators.length;
    throw new Error(
      `Role-balanced assignment needs ${shortage} more team contact${shortage === 1 ? "" : "s"}.`,
    );
  }

  const emptyTeams = shuffle(teams.filter((team) => team.memberCount === 0), random);
  const newTeams = makeNewTeams(
    Math.max(0, desiredTeamCount - emptyTeams.length),
    teams.map((team) => team.name),
  );
  const leaderTeamKeys = [
    ...emptyTeams.slice(0, desiredTeamCount).map((team) => team.id),
    ...newTeams.map((team) => team.key),
  ];
  const teamSizes = Object.fromEntries(leaderTeamKeys.map((key) => [key, 0]));
  const teamCoordinators = coordinators.slice(0, desiredTeamCount);
  const assignments = teamCoordinators.map((leader, index) => {
    const teamKey = leaderTeamKeys[index];
    if (!teamKey) throw new Error("Could not find a team for every leader.");
    teamSizes[teamKey] = 1;
    return { participantId: leader.id, teamKey };
  });
  const remainingParticipants = shuffle(
    participants.filter((participant) => !teamCoordinators.some((coordinator) => coordinator.id === participant.id)),
    random,
  );

  remainingParticipants.forEach((participant) => {
    const minimumSize = Math.min(...leaderTeamKeys.map((key) => teamSizes[key]));
    const teamKey = leaderTeamKeys.find((key) => teamSizes[key] === minimumSize);
    if (!teamKey) throw new Error("Could not find a team for automatic assignment.");
    teamSizes[teamKey] += 1;
    assignments.push({ participantId: participant.id, teamKey });
  });

  return { newTeams, assignments, teamSizes };
}

function makeNewTeams(count: number, existingNames: string[]) {
  const usedNames = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  const teams: { key: string; name: string }[] = [];
  let number = 1;

  while (teams.length < count) {
    const name = `Team ${number}`;
    number += 1;
    if (usedNames.has(name.toLowerCase())) continue;
    usedNames.add(name.toLowerCase());
    teams.push({ key: `new:${teams.length + 1}`, name });
  }

  return teams;
}

function shuffle<T>(values: T[], random: () => number) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
