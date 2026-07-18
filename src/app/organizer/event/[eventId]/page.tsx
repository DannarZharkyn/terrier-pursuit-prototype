import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, Clock, ClipboardCheck, UserMinus, Users } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EventDashboardPageProps = {
  params: {
    eventId: string;
  };
};

type TeamRow = {
  id: string;
  name: string;
  memberCount: number;
  submissionStatus: string;
  submissionTime: string;
};

export default async function EventDashboardPage({
  params,
}: EventDashboardPageProps) {
  noStore();
  const dashboard = await getEventDashboard(params.eventId);

  if (!dashboard) {
    notFound();
  }

  const summary = [
    { label: "Registered Students", value: dashboard.participantCount, icon: Users },
    { label: "Teams", value: dashboard.teamCount, icon: ClipboardCheck },
    {
      label: "Unassigned Students",
      value: dashboard.unassignedCount,
      icon: UserMinus,
      href: `/organizer/event/${params.eventId}/unassigned`,
    },
    { label: "Submitted Teams", value: dashboard.submittedTeamCount, icon: Clock },
  ];

  return (
    <OrganizerShell
      title={dashboard.name}
      subtitle="Monitor registration, team formation, and submission review progress."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="h-6 w-6 text-bu-red" />
              <p className="mt-4 text-3xl font-black text-gray-950">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-600">
                {item.label}
              </p>
              {item.href ? (
                <p className="mt-4 text-sm font-bold text-bu-red">
                  View list
                </p>
              ) : null}
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="card block p-5 transition hover:-translate-y-0.5 hover:border-bu-red"
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={item.label} className="card p-5">
              {content}
            </div>
          );
        })}
      </div>
      <section className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
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
              {dashboard.teams.length ? (
                dashboard.teams.map((team) => (
                  <tr key={team.id} className="bg-white">
                    <td className="px-5 py-4 font-bold text-gray-950">
                      {team.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {team.memberCount} members
                    </td>
                    <td className="px-5 py-4">
                      <span className="status-pill bg-bu-soft text-bu-dark">
                        {team.submissionStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {team.submissionTime}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/organizer/team/${team.id}`}
                        className="btn-secondary py-2"
                      >
                        Review
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
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

async function getEventDashboard(eventId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .single();

  if (eventError) {
    return null;
  }

  const { data: participants, error: participantError } = await supabase
    .from("participants")
    .select("id")
    .eq("event_id", eventId);

  if (participantError) {
    throw new Error(`Could not load participants: ${participantError.message}`);
  }

  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select("id, name")
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

  const submissions = teamIds.length
    ? await supabase
        .from("submissions")
        .select("team_id, status, submitted_at")
        .in("team_id", teamIds)
    : { data: [], error: null };

  if (submissions.error) {
    throw new Error(`Could not load submissions: ${submissions.error.message}`);
  }

  const { data: teamRequests, error: teamRequestError } = await supabase
    .from("participant_team_requests")
    .select("participant_id")
    .eq("event_id", eventId);

  if (teamRequestError) {
    throw new Error(`Could not load team requests: ${teamRequestError.message}`);
  }

  const participantIds = new Set(
    (participants ?? []).map((participant) => participant.id as string),
  );
  const requestedParticipantCount = (teamRequests ?? []).filter((request) =>
    participantIds.has(request.participant_id as string),
  ).length;

  const memberCounts = new Map<string, number>();

  for (const membership of memberships.data ?? []) {
    const teamId = membership.team_id as string;
    memberCounts.set(teamId, (memberCounts.get(teamId) ?? 0) + 1);
  }

  const submissionByTeam = new Map<string, { status: string; submittedAt: string }>();

  for (const submission of submissions.data ?? []) {
    const teamId = submission.team_id as string;

    if (!submissionByTeam.has(teamId)) {
      submissionByTeam.set(teamId, {
        status: submission.status as string,
        submittedAt: submission.submitted_at as string,
      });
    }
  }

  const teamRows: TeamRow[] = (teams ?? []).map((team) => {
    const submission = submissionByTeam.get(team.id as string);

    return {
      id: team.id as string,
      name: team.name as string,
      memberCount: memberCounts.get(team.id as string) ?? 0,
      submissionStatus: submission ? formatStatus(submission.status) : "Not Submitted",
      submissionTime: submission ? formatTime(submission.submittedAt) : "-",
    };
  });

  return {
    name: event.name as string,
    participantCount: String(participants?.length ?? 0),
    teamCount: String(teamRows.length),
    unassignedCount: String(requestedParticipantCount),
    submittedTeamCount: String(submissionByTeam.size),
    teams: teamRows,
  };
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
