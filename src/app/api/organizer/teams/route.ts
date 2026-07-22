import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { generateTeamCode } from "@/lib/participant-teams/team-code";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const maxTeamCodeAttempts = 5;

type CreateOrganizerTeamBody = {
  eventId?: unknown;
  teamName?: unknown;
};

export async function POST(request: Request) {
  let body: CreateOrganizerTeamBody;

  try {
    body = (await request.json()) as CreateOrganizerTeamBody;
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const eventId = stringValue(body.eventId).trim();
  const teamName = collapseWhitespace(stringValue(body.teamName));

  if (!isUuid(eventId)) {
    return json({ ok: false, error: "Please check the event." }, 400);
  }

  if (!teamName || teamName.length > 80) {
    return json({ ok: false, error: "Team name must be between 1 and 80 characters." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return json({ ok: false, error: eventError.message }, 500);
  }

  if (!event) {
    return json({ ok: false, error: "Event not found." }, 404);
  }

  for (let attempt = 1; attempt <= maxTeamCodeAttempts; attempt += 1) {
    const teamCode = generateTeamCode();
    const { data, error } = await supabase
      .from("teams")
      .insert({
        event_id: eventId,
        name: teamName,
        normalized_name: teamName.toLowerCase(),
        team_code: teamCode,
        assignment_method: "manual",
      })
      .select("id, name, team_code")
      .single();

    if (!error && data) {
      revalidatePath(`/organizer/event/${eventId}`);
      revalidatePath(`/organizer/event/${eventId}/unassigned`);
      return json({
        ok: true,
        team: {
          id: data.id as string,
          name: data.name as string,
          code: data.team_code as string,
          memberCount: 0,
        },
      });
    }

    if (isDuplicateTeamName(error)) {
      return json({ ok: false, error: "That team name is already taken for this event." }, 409);
    }

    if (isDuplicateTeamCode(error) && attempt < maxTeamCodeAttempts) {
      continue;
    }

    return json({ ok: false, error: error?.message ?? "Could not create team." }, 500);
  }

  return json({ ok: false, error: "Could not generate a unique team code." }, 500);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isDuplicateTeamName(error: { code?: string; message?: string } | null) {
  return error?.code === "23505" && Boolean(error.message?.includes("normalized_name"));
}

function isDuplicateTeamCode(error: { code?: string; message?: string } | null) {
  return error?.code === "23505" && Boolean(error.message?.includes("team_code"));
}

function json(body: object, status = 200) {
  return NextResponse.json(body, { status });
}
