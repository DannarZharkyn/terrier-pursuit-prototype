import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AssignmentBody = {
  eventId?: unknown;
  participantId?: unknown;
  teamId?: unknown;
};

export async function POST(request: Request) {
  let body: AssignmentBody;

  try {
    body = (await request.json()) as AssignmentBody;
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const eventId = stringValue(body.eventId);
  const participantId = stringValue(body.participantId);
  const teamId = stringValue(body.teamId);

  if (![eventId, participantId, teamId].every(isUuid)) {
    return json({ ok: false, error: "Please check the event, participant, and team." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: participant, error: participantError }, { data: team, error: teamError }] =
    await Promise.all([
      supabase
        .from("participants")
        .select("id")
        .eq("id", participantId)
        .eq("event_id", eventId)
        .maybeSingle(),
      supabase
        .from("teams")
        .select("id, name")
        .eq("id", teamId)
        .eq("event_id", eventId)
        .maybeSingle(),
    ]);

  if (participantError || teamError) {
    return json(
      { ok: false, error: participantError?.message ?? teamError?.message ?? "Could not validate assignment." },
      500,
    );
  }

  if (!participant || !team) {
    return json({ ok: false, error: "The participant and team must belong to this event." }, 404);
  }

  const { data: existingMemberships, error: membershipLookupError } = await supabase
    .from("team_memberships")
    .select("team_id, teams!inner(event_id)")
    .eq("participant_id", participantId)
    .eq("teams.event_id", eventId);

  if (membershipLookupError) {
    return json({ ok: false, error: membershipLookupError.message }, 500);
  }

  const existingTeamId = (existingMemberships ?? [])[0]?.team_id as string | undefined;

  if (existingTeamId && existingTeamId !== teamId) {
    return json({ ok: false, error: "This participant is already assigned to another team." }, 409);
  }

  if (!existingTeamId) {
    const { error: insertError } = await supabase
      .from("team_memberships")
      .insert({ team_id: teamId, participant_id: participantId });

    if (insertError) {
      return json({ ok: false, error: insertError.message }, 500);
    }
  }

  const { error: requestDeleteError } = await supabase
    .from("participant_team_requests")
    .delete()
    .eq("event_id", eventId)
    .eq("participant_id", participantId);

  if (requestDeleteError) {
    return json({ ok: false, error: requestDeleteError.message }, 500);
  }

  return json({ ok: true, team: { id: teamId, name: team.name as string } });
}

export async function DELETE(request: Request) {
  let body: AssignmentBody;

  try {
    body = (await request.json()) as AssignmentBody;
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const eventId = stringValue(body.eventId);
  const participantId = stringValue(body.participantId);
  const teamId = stringValue(body.teamId);

  if (![eventId, participantId, teamId].every(isUuid)) {
    return json({ ok: false, error: "Please check the event, participant, and team." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: participant, error: participantError }, { data: team, error: teamError }] =
    await Promise.all([
      supabase
        .from("participants")
        .select("id")
        .eq("id", participantId)
        .eq("event_id", eventId)
        .maybeSingle(),
      supabase
        .from("teams")
        .select("id, name")
        .eq("id", teamId)
        .eq("event_id", eventId)
        .maybeSingle(),
    ]);

  if (participantError || teamError) {
    return json(
      { ok: false, error: participantError?.message ?? teamError?.message ?? "Could not validate removal." },
      500,
    );
  }

  if (!participant || !team) {
    return json({ ok: false, error: "The participant and team must belong to this event." }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("team_memberships")
    .select("team_id")
    .eq("team_id", teamId)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (membershipError) {
    return json({ ok: false, error: membershipError.message }, 500);
  }

  if (!membership) {
    return json({ ok: false, error: "This participant is not on that team." }, 404);
  }

  const { error: deleteError } = await supabase
    .from("team_memberships")
    .delete()
    .eq("team_id", teamId)
    .eq("participant_id", participantId);

  if (deleteError) {
    return json({ ok: false, error: deleteError.message }, 500);
  }

  const { data: remainingMemberships, error: remainingMembershipsError } = await supabase
    .from("team_memberships")
    .select("participant_id")
    .eq("team_id", teamId)
    .limit(1);

  if (remainingMembershipsError) {
    return json({ ok: false, error: remainingMembershipsError.message }, 500);
  }

  const teamDeleted = (remainingMemberships ?? []).length === 0;

  if (teamDeleted) {
    const { error: teamDeleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
      .eq("event_id", eventId);

    if (teamDeleteError) {
      return json({ ok: false, error: teamDeleteError.message }, 500);
    }
  }

  revalidatePath(`/organizer/event/${eventId}`);
  revalidatePath(`/organizer/event/${eventId}/unassigned`);
  return json({
    ok: true,
    teamDeleted,
    team: { id: teamId, name: team.name as string },
  });
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
