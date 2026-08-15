import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDataEnvironment } from "@/lib/data-environment";
import { validateParticipantTeamRequest } from "@/lib/participant-team-requests/validation";
import type { ParticipantTeamRequestResponse } from "@/lib/participant-team-requests/types";

type TeamRequestRow = {
  event_id: string;
  participant_id: string;
  requested_at: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const validation = validateParticipantTeamRequest({
    eventId: url.searchParams.get("eventId"),
    participantId: url.searchParams.get("participantId"),
  });

  if (!validation.data) {
    return json(
      {
        ok: false,
        error: "Please check the team request lookup.",
        details: validation.errors,
      },
      400,
    );
  }

  const supabase = createSupabaseAdminClient();
  const teamRequest = await getTeamRequest(
    supabase,
    validation.data.eventId,
    validation.data.participantId,
  );

  if (!teamRequest.ok) {
    return json({ ok: false, error: teamRequest.error }, teamRequest.status);
  }

  return json({ ok: true, request: teamRequest.request });
}

export async function POST(request: Request) {
  const validation = await validateJsonRequest(request);

  if (!validation.ok) {
    return validation.response;
  }

  const supabase = createSupabaseAdminClient();
  const participant = await getPublishedEventParticipant(
    supabase,
    validation.data.eventId,
    validation.data.participantId,
  );

  if (!participant.ok) {
    return json({ ok: false, error: participant.error }, participant.status);
  }

  const alreadyOnTeam = await participantAlreadyHasTeam(
    supabase,
    validation.data.eventId,
    validation.data.participantId,
  );

  if (alreadyOnTeam.error) {
    return json({ ok: false, error: alreadyOnTeam.error }, 500);
  }

  if (alreadyOnTeam.value) {
    return json(
      {
        ok: false,
        error: "You are already on a team for this event.",
      },
      409,
    );
  }

  const { data, error } = await supabase
    .from("participant_team_requests")
    .upsert(
      {
        event_id: validation.data.eventId,
        participant_id: validation.data.participantId,
      },
      {
        onConflict: "event_id,participant_id",
        ignoreDuplicates: true,
      },
    )
    .select("event_id, participant_id, requested_at")
    .single();

  if (error) {
    const existing = await getTeamRequest(
      supabase,
      validation.data.eventId,
      validation.data.participantId,
    );

    if (existing.ok && existing.request) {
      return json({ ok: true, request: existing.request });
    }

    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, request: normalizeRequest(data as TeamRequestRow) });
}

export async function DELETE(request: Request) {
  const validation = await validateJsonRequest(request);

  if (!validation.ok) {
    return validation.response;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("participant_team_requests")
    .delete()
    .eq("event_id", validation.data.eventId)
    .eq("participant_id", validation.data.participantId);

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true, request: null });
}

function json(response: ParticipantTeamRequestResponse, status = 200) {
  return NextResponse.json(response, { status });
}

async function validateJsonRequest(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false as const,
      response: json({ ok: false, error: "Request body must be valid JSON." }, 400),
    };
  }

  const value = isRecord(body) ? body : {};
  const validation = validateParticipantTeamRequest({
    eventId: value.eventId,
    participantId: value.participantId,
  });

  if (!validation.data) {
    return {
      ok: false as const,
      response: json(
        {
          ok: false,
          error: "Please check the team request.",
          details: validation.errors,
        },
        400,
      ),
    };
  }

  return { ok: true as const, data: validation.data };
}

async function getTeamRequest(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
): Promise<
  | { ok: true; request: ReturnType<typeof normalizeRequest> | null }
  | { ok: false; error: string; status: number }
> {
  const { data, error } = await supabase
    .from("participant_team_requests")
    .select("event_id, participant_id, requested_at")
    .eq("event_id", eventId)
    .eq("participant_id", participantId);

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const request = ((data ?? []) as unknown as TeamRequestRow[])[0];
  return { ok: true, request: request ? normalizeRequest(request) : null };
}

async function getPublishedEventParticipant(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("status", "published")
    .eq("data_environment", getDataEnvironment());

  if (eventError) {
    return { ok: false, error: eventError.message, status: 500 };
  }

  if (!eventData || eventData.length !== 1) {
    return {
      ok: false,
      error: "We could not find this participant in a published event.",
      status: 404,
    };
  }

  const { data, error } = await supabase
    .from("participants")
    .select("id, event_id")
    .eq("id", participantId)
    .eq("event_id", eventId);

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  if (!data || data.length !== 1) {
    return {
      ok: false,
      error: "We could not find this participant in a published event.",
      status: 404,
    };
  }

  return { ok: true };
}

async function participantAlreadyHasTeam(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
) {
  const { data, error } = await supabase
    .from("team_memberships")
    .select("team_id, teams!inner(event_id)")
    .eq("participant_id", participantId)
    .eq("teams.event_id", eventId)
    .limit(1);

  if (error) {
    return { error: error.message };
  }

  return { value: Boolean(data?.length) };
}

function normalizeRequest(row: TeamRequestRow) {
  return {
    eventId: row.event_id,
    participantId: row.participant_id,
    requestedAt: row.requested_at,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
