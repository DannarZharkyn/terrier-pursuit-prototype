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

type TeamRequestRow = {
  participant_id: string;
  requested_at: string;
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

export default async function UnassignedStudentsPage({
  params,
}: UnassignedStudentsPageProps) {
  noStore();
  const { students, teams } = await getUnassignedPageData(params.eventId);
  return (
    <OrganizerShell
      title="Unassigned Students"
      subtitle="Review participants who asked the organizer to place them into a team."
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
  const { data: requests, error: requestError } = await supabase
    .from("participant_team_requests")
    .select("participant_id, requested_at")
    .eq("event_id", eventId)
    .order("requested_at", { ascending: true });

  if (requestError) {
    throw new Error(`Could not load team requests: ${requestError.message}`);
  }

  const requestRows = (requests ?? []) as unknown as TeamRequestRow[];
  const requestedParticipantIds = requestRows.map(
    (request) => request.participant_id,
  );
  const participants = requestedParticipantIds.length
    ? await supabase
        .from("participants")
        .select("id, first_name, last_name, email")
        .eq("event_id", eventId)
        .in("id", requestedParticipantIds)
    : { data: [], error: null };

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
        .select("team_id")
        .in("team_id", teamIds)
    : { data: [], error: null };

  if (memberships.error) {
    throw new Error(`Could not load team memberships: ${memberships.error.message}`);
  }

  const memberCounts = new Map<string, number>();

  for (const membership of memberships.data ?? []) {
    const teamId = membership.team_id as string;
    memberCounts.set(teamId, (memberCounts.get(teamId) ?? 0) + 1);
  }

  const participantById = new Map(
    ((participants.data ?? []) as unknown as ParticipantRow[]).map(
      (participant) => [participant.id, participant],
    ),
  );

  return {
    students: requestRows
      .map((request) => {
        const participant = participantById.get(request.participant_id);

        if (!participant) {
          return undefined;
        }

        return {
          id: participant.id,
          name: `${participant.first_name} ${participant.last_name}`,
          email: participant.email,
          requestedAt: formatTime(request.requested_at),
        };
      })
      .filter((student): student is NonNullable<typeof student> =>
        Boolean(student),
      ),
    teams: ((teams ?? []) as unknown as TeamRow[]).map((team) => ({
      id: team.id,
      name: team.name,
      code: team.team_code,
      memberCount: memberCounts.get(team.id) ?? 0,
    })),
  };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
