import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, CalendarCheck, CalendarClock, ChevronDown, Clock, ClipboardCheck, Lock, Mail, MapPinned, Pencil, ScrollText, ShieldCheck, UserMinus, Users } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";
import { EventEmailTemplate } from "@/components/event-email-template";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createEventInvitationEmail } from "@/lib/email/event-invitation";

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
  memberNames: string[];
  submissionStatus: string;
  submissionTime: string;
};

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type EventLocationRow = {
  id: string;
  landmark: string;
  campus_population: string;
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
    <OrganizerShell title={dashboard.name}>
      <div className="mb-5">
        <PageBackLink href="/organizer/dashboard" label="Back to Dashboard" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      <section className="relative mb-6 rounded-lg bg-bu-red p-4 text-white shadow-soft sm:p-5">
        <Link
          href={`/organizer/event/${params.eventId}/edit`}
          className="absolute right-4 top-4 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-bu-red shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-200"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Game
        </Link>
        <div className="grid gap-4 pt-12 sm:grid-cols-3 sm:gap-5 sm:pr-28 sm:pt-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-100">
              Participant game code
            </p>
            <p className="mt-1 font-mono text-2xl font-black tracking-[0.14em]">
              {dashboard.gameCode}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-100">
              <CalendarClock className="h-3.5 w-3.5" />
              Game starts
            </p>
            <p className="mt-1 text-sm font-bold leading-5">{dashboard.startTime}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-100">
              <CalendarCheck className="h-3.5 w-3.5" />
              Submission deadline
            </p>
            <p className="mt-1 text-sm font-bold leading-5">{dashboard.submissionDeadline}</p>
          </div>
        </div>
      </section>
      <section className="mb-6">
        <details className="group card overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-bu-red [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-bu-red">
              <ScrollText className="h-5 w-5" />
              <span className="font-black text-gray-950">Game Rules</span>
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-gray-200 bg-white px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{dashboard.rules}</p>
          </div>
        </details>
      </section>
      <section className="mb-6">
        <details className="group card overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-bu-red [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-bu-red">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-black text-gray-950">Participant Disclaimer</span>
              {dashboard.disclaimerLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-gray-700">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              ) : null}
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-gray-200 bg-white px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {dashboard.disclaimer}
            </p>
          </div>
        </details>
      </section>
      <details className="group mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-bu-red [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-bu-red" />
            <span className="font-black text-gray-950">Participant Invitation Email</span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-gray-200 bg-gray-50 p-3 sm:p-4">
          <EventEmailTemplate
            recipients={dashboard.emailRecipients}
            subject={dashboard.emailSubject}
            body={dashboard.emailBody}
          />
        </div>
      </details>
      <details className="group mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-gray-50 px-5 py-4 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-bu-red [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-bu-red" />
            <span className="text-lg font-black text-gray-950">Landmarks Used</span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition group-open:rotate-180" />
        </summary>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-white text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Landmark</th>
                <th className="px-5 py-3">Campus Population</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboard.locations.length ? dashboard.locations.map((location) => (
                <tr key={location.id}>
                  <td className="px-5 py-4 font-bold text-gray-950">{location.landmark}</td>
                  <td className="px-5 py-4 text-gray-600">{location.campusPopulation}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-5 py-4 text-gray-600" colSpan={2}>No landmarks were uploaded for this event.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
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
                      <details className="group w-fit">
                        <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-bu-red [&::-webkit-details-marker]:hidden">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {team.memberCount} members
                          </span>
                        </summary>
                        <div className="mt-2 min-w-36 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                          {team.memberNames.length ? (
                            <ul className="space-y-0.5 text-xs font-medium text-gray-700">
                              {team.memberNames.map((memberName, index) => (
                                <li key={`${memberName}-${index}`}>{memberName}</li>
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
    .select("id, name, game_code, starts_at, submission_deadline, rules, disclaimer_text, disclaimer_locked_at, email_subject, email_body")
    .eq("id", eventId)
    .single();

  if (eventError) {
    return null;
  }

  const { data: participants, error: participantError } = await supabase
    .from("participants")
    .select("id, first_name, last_name, email")
    .eq("event_id", eventId);

  if (participantError) {
    throw new Error(`Could not load participants: ${participantError.message}`);
  }

  const { data: locations, error: locationsError } = await supabase
    .from("event_locations")
    .select("id, landmark, campus_population")
    .eq("event_id", eventId)
    .order("position", { ascending: true });

  if (locationsError) {
    throw new Error(`Could not load event locations: ${locationsError.message}`);
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
        .from("team_hunt_submissions")
        .select("team_id, status, submitted_at")
        .in("team_id", teamIds)
    : { data: [], error: null };

  if (submissions.error) {
    throw new Error(`Could not load submissions: ${submissions.error.message}`);
  }

  const participantRows = (participants ?? []) as unknown as ParticipantRow[];
  const generatedEmail = createEventInvitationEmail({
    eventName: event.name as string,
    gameCode: (event.game_code as string | null) ?? "",
    startsAt: event.starts_at as string,
    submissionDeadline: event.submission_deadline as string,
    rules: (event.rules as string | null) ?? "",
    participantUrl: new URL(
      "/participant/welcome",
      process.env.NEXT_PUBLIC_APP_URL || "https://terrier-pursuit-prototype.vercel.app",
    ).toString(),
  });
  const participantIds = new Set(
    participantRows.map((participant) => participant.id),
  );
  const assignedParticipantIds = new Set(
    (memberships.data ?? []).map((membership) => membership.participant_id as string),
  );
  const unassignedParticipantCount = [...participantIds].filter(
    (participantId) => !assignedParticipantIds.has(participantId),
  ).length;

  const memberCounts = new Map<string, number>();
  const memberNames = new Map<string, string[]>();
  const participantNameById = new Map(
    participantRows.map((participant) => [
      participant.id,
      `${participant.first_name} ${participant.last_name}`,
    ]),
  );

  for (const membership of memberships.data ?? []) {
    const teamId = membership.team_id as string;
    memberCounts.set(teamId, (memberCounts.get(teamId) ?? 0) + 1);
    const memberName = participantNameById.get(membership.participant_id as string);

    if (memberName) {
      memberNames.set(teamId, [...(memberNames.get(teamId) ?? []), memberName]);
    }
  }

  const submissionByTeam = new Map<string, { status: string; submittedAt: string | null }>();

  for (const submission of submissions.data ?? []) {
    const teamId = submission.team_id as string;

    if (!submissionByTeam.has(teamId)) {
      submissionByTeam.set(teamId, {
        status: submission.status as string,
        submittedAt: submission.submitted_at as string | null,
      });
    }
  }

  const teamRows: TeamRow[] = (teams ?? []).map((team) => {
    const submission = submissionByTeam.get(team.id as string);

    return {
      id: team.id as string,
      name: team.name as string,
      memberCount: memberCounts.get(team.id as string) ?? 0,
      memberNames: memberNames.get(team.id as string) ?? [],
      submissionStatus: submission ? formatStatus(submission.status) : "Not Submitted",
      submissionTime: submission?.submittedAt ? formatTime(submission.submittedAt) : "-",
    };
  });

  return {
    name: event.name as string,
    gameCode: (event.game_code as string | null) ?? "Not published",
    startTime: event.starts_at
      ? formatEventDateTime(event.starts_at as string)
      : "Not scheduled",
    submissionDeadline: event.submission_deadline
      ? formatEventDateTime(event.submission_deadline as string)
      : "Not scheduled",
    rules: (event.rules as string | null) ?? "No rules were provided.",
    disclaimer: (event.disclaimer_text as string | null) ?? "No disclaimer was provided.",
    disclaimerLocked: Boolean(event.disclaimer_locked_at),
    emailRecipients: participantRows.map((participant) => participant.email).join(", "),
    emailSubject: (event.email_subject as string | null) ?? generatedEmail.subject,
    emailBody: (event.email_body as string | null) ?? generatedEmail.body,
    locations: ((locations ?? []) as unknown as EventLocationRow[]).map((location) => ({
      id: location.id,
      landmark: location.landmark,
      campusPopulation: location.campus_population,
    })),
    participantCount: String(participants?.length ?? 0),
    teamCount: String(teamRows.length),
    unassignedCount: String(unassignedParticipantCount),
    submittedTeamCount: String(
      [...submissionByTeam.values()].filter((submission) => submission.status !== "draft").length,
    ),
    teams: teamRows,
  };
}

function formatEventDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
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
