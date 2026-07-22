import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { OrganizerShell } from "@/components/organizer-shell";
import { UnassignedStudentsContent } from "@/components/unassigned-students-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UnassignedStudentsPageProps = {
  params: {
    eventId: string;
  };
};

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type TeamRow = {
  id: string;
  name: string;
  team_code: string;
};

type TeamMembershipRow = {
  team_id: string;
  participant_id: string;
};

export default async function UnassignedStudentsPage({
  params,
}: UnassignedStudentsPageProps) {
  noStore();
  const { students, teams } = await getUnassignedPageData(params.eventId);
  return (
    <OrganizerShell
      title="Unassigned Students"
      subtitle="Review every participant in this event who is not currently on a team."
    >
      <div className="mb-6">
        <Link
          href={`/organizer/event/${params.eventId}`}
          className="text-sm font-bold text-bu-red hover:text-bu-dark"
        >
          Back to Event Dashboard
        </Link>
      </div>

      <UnassignedStudentsContent
        eventId={params.eventId}
        initialStudents={students}
        initialTeams={teams}
      />
    </OrganizerShell>
  );
}

async function getUnassignedPageData(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const participants = await supabase
    .from("participants")
    .select("id, first_name, last_name, email")
    .eq("event_id", eventId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (participants.error) {
    throw new Error(`Could not load participants: ${participants.error.message}`);
  }

  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select("id, name, team_code")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (teamError) {
    throw new Error(`Could not load teams: ${teamError.message}`);
  }

  const teamIds = (teams ?? []).map((team) => team.id as string);
  const memberships = teamIds.length
    ? await supabase
        .from("team_memberships")
        .select("team_id, participant_id")
        .in("team_id", teamIds)
    : { data: [], error: null };

  if (memberships.error) {
    throw new Error(`Could not load team memberships: ${memberships.error.message}`);
  }

  const membershipRows = (memberships.data ?? []) as unknown as TeamMembershipRow[];
  const participantRows = (participants.data ?? []) as unknown as ParticipantRow[];
  const memberNamesByParticipantId = new Map(
    participantRows.map((participant) => [
      participant.id,
      `${participant.first_name} ${participant.last_name}`,
    ]),
  );
  const memberNamesByTeamId = new Map<string, string[]>();
  const assignedParticipantIds = new Set<string>();

  for (const membership of membershipRows) {
    assignedParticipantIds.add(membership.participant_id);
    const memberName = memberNamesByParticipantId.get(membership.participant_id);

    if (memberName) {
      memberNamesByTeamId.set(membership.team_id, [
        ...(memberNamesByTeamId.get(membership.team_id) ?? []),
        memberName,
      ]);
    }
  }

  return {
    students: participantRows
      .filter((participant) => !assignedParticipantIds.has(participant.id))
      .map((participant) => ({
        id: participant.id,
        name: `${participant.first_name} ${participant.last_name}`,
        email: participant.email,
      })),
    teams: ((teams ?? []) as unknown as TeamRow[]).map((team) => ({
      id: team.id,
      name: team.name,
      code: team.team_code,
      memberCount: memberNamesByTeamId.get(team.id)?.length ?? 0,
      memberNames: memberNamesByTeamId.get(team.id) ?? [],
    })),
  };
}
