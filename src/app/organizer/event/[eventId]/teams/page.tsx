import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatBostonDateTime } from "@/lib/time/boston";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
};

export default async function EventTeamsPage({
  params,
}: {
  params: { eventId: string };
}) {
  noStore();
  const dashboard = await getEventTeams(params.eventId);

  if (!dashboard) {
    notFound();
  }

  return (
    <OrganizerShell
      title={`${dashboard.eventName} Teams`}
      subtitle="Review team membership and submission progress."
    >
      <div className="mb-6">
        <PageBackLink
          href={`/organizer/event/${params.eventId}`}
          label="Back to Event"
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-black text-gray-950">Teams</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Team Name</th>
                <th className="px-5 py-3">Members</th>
                <th className="px-5 py-3">Submission Status</th>
                <th className="px-5 py-3">Submission Time</th>
                <th className="px-5 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboard.teams.length ? dashboard.teams.map((team) => (
                <tr key={team.id}>
                  <td className="px-5 py-4 font-bold text-gray-950">{team.name}</td>
                  <td className="px-5 py-4 text-gray-600">
                    <details className="group w-fit">
                      <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-bu-red [&::-webkit-details-marker]:hidden">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {team.memberNames.length} members
                        </span>
                      </summary>
                      <div className="mt-2 min-w-36 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                        {team.memberNames.length ? (
                          <ul className="space-y-0.5 text-xs font-medium text-gray-700">
                            {team.memberNames.map((name, index) => (
                              <li key={`${name}-${index}`}>{name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500">No members yet.</p>
                        )}
                      </div>
                    </details>
                  </td>
                  <td className="px-5 py-4">
                    <span className="status-pill bg-bu-soft text-bu-dark">
                      {team.submissionStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{team.submissionTime}</td>
                  <td className="px-5 py-4">
                    <Link href={`/organizer/team/${team.id}`} className="btn-secondary py-2">
                      Review
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-5 py-4 text-gray-600" colSpan={5}>
                    No teams have been created for this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </OrganizerShell>
  );
}

async function getEventTeams(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const event = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .maybeSingle();

  if (event.error || !event.data) {
    return undefined;
  }

  const teams = await supabase
    .from("teams")
    .select("id, name")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (teams.error) {
    throw new Error(`Could not load teams: ${teams.error.message}`);
  }

  const teamIds = (teams.data ?? []).map((team) => team.id as string);
  const participants = await supabase
    .from("participants")
    .select("id, first_name, last_name")
    .eq("event_id", eventId);
  const memberships = teamIds.length
    ? await supabase
        .from("team_memberships")
        .select("team_id, participant_id")
        .in("team_id", teamIds)
    : { data: [], error: null };
  const submissions = teamIds.length
    ? await supabase
        .from("team_hunt_submissions")
        .select("team_id, status, submitted_at")
        .in("team_id", teamIds)
    : { data: [], error: null };

  if (participants.error || memberships.error || submissions.error) {
    throw new Error(
      participants.error?.message
      || memberships.error?.message
      || submissions.error?.message,
    );
  }

  const participantNames = new Map(
    ((participants.data ?? []) as ParticipantRow[]).map((participant) => [
      participant.id,
      `${participant.first_name} ${participant.last_name}`,
    ]),
  );
  const membersByTeam = new Map<string, string[]>();

  for (const membership of memberships.data ?? []) {
    const name = participantNames.get(membership.participant_id as string);
    const teamId = membership.team_id as string;
    if (name) {
      membersByTeam.set(teamId, [...(membersByTeam.get(teamId) ?? []), name]);
    }
  }

  const submissionByTeam = new Map(
    (submissions.data ?? []).map((submission) => [
      submission.team_id as string,
      {
        status: submission.status as string,
        submittedAt: submission.submitted_at as string | null,
      },
    ]),
  );

  return {
    eventName: event.data.name as string,
    teams: (teams.data ?? []).map((team) => {
      const submission = submissionByTeam.get(team.id as string);
      return {
        id: team.id as string,
        name: team.name as string,
        memberNames: membersByTeam.get(team.id as string) ?? [],
        submissionStatus: submission ? formatStatus(submission.status) : "Not Submitted",
        submissionTime: submission?.submittedAt ? formatBostonDateTime(submission.submittedAt) : "-",
      };
    }),
  };
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
