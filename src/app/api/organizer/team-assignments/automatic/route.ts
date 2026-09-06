import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDataEnvironment } from "@/lib/data-environment";
import { generateTeamCode } from "@/lib/participant-teams/team-code";
import {
  planAutomaticAssignments,
  type AutomaticAssignmentMode,
} from "@/lib/team-assignment/automatic";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const maxTeamCodeAttempts = 5;

export async function POST(request: Request) {
  let body: { eventId?: unknown; mode?: unknown; targetTeamSize?: unknown };

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const eventId = stringValue(body.eventId);
  const mode = stringValue(body.mode) as AutomaticAssignmentMode;
  const targetTeamSize = Number(body.targetTeamSize);

  if (!isUuid(eventId)) {
    return json({ ok: false, error: "Please check the event." }, 400);
  }

  if (mode !== "random" && mode !== "role_balanced") {
    return json({ ok: false, error: "Choose random or role-balanced assignment." }, 400);
  }

  if (!Number.isInteger(targetTeamSize) || targetTeamSize < 2 || targetTeamSize > 20) {
    return json({ ok: false, error: "Target team size must be between 2 and 20." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const eventResult = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("data_environment", getDataEnvironment())
    .maybeSingle();

  if (eventResult.error) return json({ ok: false, error: eventResult.error.message }, 500);
  if (!eventResult.data) return json({ ok: false, error: "Event not found." }, 404);

  const [participantResult, teamResult] = await Promise.all([
    supabase
      .from("participants")
      .select("id, registration_role")
      .eq("event_id", eventId),
    supabase
      .from("teams")
      .select("id, name")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
  ]);

  if (participantResult.error || teamResult.error) {
    return json({
      ok: false,
      error: participantResult.error?.message ?? teamResult.error?.message ?? "Could not load assignment data.",
    }, 500);
  }

  const teams = (teamResult.data ?? []) as { id: string; name: string }[];
  const teamIds = teams.map((team) => team.id);
  const membershipResult = teamIds.length
    ? await supabase.from("team_memberships").select("team_id, participant_id").in("team_id", teamIds)
    : { data: [], error: null };

  if (membershipResult.error) {
    return json({ ok: false, error: membershipResult.error.message }, 500);
  }

  const memberships = (membershipResult.data ?? []) as { team_id: string; participant_id: string }[];
  const assignedIds = new Set(memberships.map((membership) => membership.participant_id));
  const unassignedParticipants = ((participantResult.data ?? []) as {
    id: string;
    registration_role: "leader" | "participant" | null;
  }[]).filter((participant) => !assignedIds.has(participant.id));
  const memberCountByTeam = new Map<string, number>();
  memberships.forEach((membership) => {
    memberCountByTeam.set(membership.team_id, (memberCountByTeam.get(membership.team_id) ?? 0) + 1);
  });

  let plan;
  try {
    plan = planAutomaticAssignments({
      participants: unassignedParticipants.map((participant) => ({
        id: participant.id,
        role: participant.registration_role,
      })),
      teams: teams.map((team) => ({
        ...team,
        memberCount: memberCountByTeam.get(team.id) ?? 0,
      })),
      mode,
      targetTeamSize,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Could not plan assignments." }, 400);
  }

  const createdTeamIds: string[] = [];
  const teamIdByKey = new Map(teams.map((team) => [team.id, team.id]));

  try {
    for (const plannedTeam of plan.newTeams) {
      const created = await createAutomaticTeam(supabase, eventId, plannedTeam.name);
      createdTeamIds.push(created.id);
      teamIdByKey.set(plannedTeam.key, created.id);
    }

    const membershipRows = plan.assignments.map((assignment) => ({
      participant_id: assignment.participantId,
      team_id: teamIdByKey.get(assignment.teamKey),
    }));

    if (membershipRows.some((membership) => !membership.team_id)) {
      throw new Error("Could not resolve every planned team.");
    }

    const insertResult = await supabase.from("team_memberships").insert(membershipRows);
    if (insertResult.error) throw new Error(insertResult.error.message);

    const participantIds = plan.assignments.map((assignment) => assignment.participantId);
    if (participantIds.length) {
      await supabase
        .from("participant_team_requests")
        .delete()
        .eq("event_id", eventId)
        .in("participant_id", participantIds);
    }
  } catch (error) {
    if (createdTeamIds.length) {
      await supabase.from("teams").delete().in("id", createdTeamIds);
    }
    return json({
      ok: false,
      error: error instanceof Error ? `Automatic assignment failed: ${error.message}` : "Automatic assignment failed.",
    }, 500);
  }

  revalidatePath(`/organizer/event/${eventId}`);
  revalidatePath(`/organizer/event/${eventId}/unassigned`);

  return json({
    ok: true,
    assignedCount: plan.assignments.length,
    teamsCreated: plan.newTeams.length,
    mode,
  });
}

async function createAutomaticTeam(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  name: string,
) {
  for (let attempt = 1; attempt <= maxTeamCodeAttempts; attempt += 1) {
    const result = await supabase
      .from("teams")
      .insert({
        event_id: eventId,
        name,
        normalized_name: name.toLowerCase(),
        team_code: generateTeamCode(),
        assignment_method: "automatic",
      })
      .select("id")
      .single();

    if (!result.error && result.data) return { id: result.data.id as string };
    if (result.error?.code === "23505" && attempt < maxTeamCodeAttempts) continue;
    throw new Error(result.error?.message ?? "Could not create an automatic team.");
  }

  throw new Error("Could not generate a unique team code.");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function json(body: object, status = 200) {
  return NextResponse.json(body, { status });
}
