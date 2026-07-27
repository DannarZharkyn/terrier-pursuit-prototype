import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId")?.trim() ?? "";
  const participantId = url.searchParams.get("participantId")?.trim() ?? "";

  if (!uuidPattern.test(eventId) || !uuidPattern.test(participantId)) {
    return json({ ok: false, error: "Event or participant ID is invalid." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const context = await getContext(supabase, eventId, participantId);

  if (!context.ok) {
    return json({ ok: false, error: context.error }, context.status);
  }

  const consent = await supabase
    .from("participant_disclaimer_consents")
    .select("activity_safety_accepted, media_data_accepted, accepted_at")
    .eq("event_id", eventId)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (consent.error) {
    return json({ ok: false, error: consent.error.message }, 500);
  }

  if (!consent.data) {
    const created = await supabase
      .from("participant_disclaimer_consents")
      .insert({ event_id: eventId, participant_id: participantId })
      .select("id")
      .single();

    if (created.error && created.error.code !== "23505") {
      return json({ ok: false, error: created.error.message }, 500);
    }
  }

  return json({
    ok: true,
    accepted: Boolean(
      consent.data?.activity_safety_accepted &&
        consent.data?.media_data_accepted &&
        consent.data?.accepted_at,
    ),
    disclaimer: context.disclaimer,
    eventName: context.eventName,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  if (!isRecord(body)) {
    return json({ ok: false, error: "Please check the acceptance form." }, 400);
  }

  const eventId = stringValue(body.eventId);
  const participantId = stringValue(body.participantId);
  const activitySafetyAccepted = body.activitySafetyAccepted === true;
  const mediaDataAccepted = body.mediaDataAccepted === true;

  if (!uuidPattern.test(eventId) || !uuidPattern.test(participantId)) {
    return json({ ok: false, error: "Event or participant ID is invalid." }, 400);
  }

  if (!activitySafetyAccepted || !mediaDataAccepted) {
    return json({ ok: false, error: "Both required acknowledgments must be accepted." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const context = await getContext(supabase, eventId, participantId);

  if (!context.ok) {
    return json({ ok: false, error: context.error }, context.status);
  }

  const acceptedAt = new Date().toISOString();
  const saved = await supabase
    .from("participant_disclaimer_consents")
    .upsert(
      {
        event_id: eventId,
        participant_id: participantId,
        activity_safety_accepted: true,
        media_data_accepted: true,
        disclaimer_text_snapshot: context.disclaimer,
        accepted_at: acceptedAt,
      },
      { onConflict: "event_id,participant_id" },
    )
    .select("accepted_at")
    .single();

  if (saved.error) {
    return json({ ok: false, error: saved.error.message }, 500);
  }

  return json({ ok: true, accepted: true, acceptedAt: saved.data.accepted_at });
}

async function getContext(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
) {
  const participant = await supabase
    .from("participants")
    .select("id, events!inner(id, name, disclaimer_text)")
    .eq("id", participantId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (participant.error) {
    return { ok: false as const, error: participant.error.message, status: 500 };
  }

  if (!participant.data) {
    return {
      ok: false as const,
      error: "This participant does not belong to the event.",
      status: 403,
    };
  }

  const event = Array.isArray(participant.data.events)
    ? participant.data.events[0]
    : participant.data.events;

  return {
    ok: true as const,
    eventName: event.name as string,
    disclaimer: event.disclaimer_text as string,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function json(response: Record<string, unknown>, status = 200) {
  return NextResponse.json(response, { status });
}
