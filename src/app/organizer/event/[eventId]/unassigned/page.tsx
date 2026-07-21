import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Users } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
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

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h2 className="text-lg font-black text-gray-950">
              Unassigned List
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Participants who asked the organizer to place them.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {students.length ? (
              students.map((student, index) => (
                <button
                  key={student.id}
                  className={`block w-full px-5 py-4 text-left transition ${
                    index === 0 ? "bg-bu-soft" : "bg-white hover:bg-gray-50"
                  }`}
                  type="button"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-950">{student.name}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {student.email}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {student.requestedAt}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-4 text-sm text-gray-600">
                No participants are waiting for organizer placement.
              </div>
            )}
          </div>
        </div>

        <div>
          <section className="card overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
              <h2 className="text-lg font-black text-gray-950">
                Available Teams
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Existing teams for this event. Assignment actions will be added later.
              </p>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {teams.length ? teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-gray-950">{team.name}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {team.memberCount} members
                      </p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Team code
                      </p>
                      <p className="mt-1 font-mono text-base font-black tracking-wider text-bu-dark">
                        {team.code}
                      </p>
                    </div>
                    <span className="status-pill bg-gray-100 text-gray-700">
                      <Users className="mr-1 h-3 w-3" />
                      {team.memberCount}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-600">No teams have been created for this event.</p>
              )}
            </div>
          </section>
        </div>
      </section>
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
