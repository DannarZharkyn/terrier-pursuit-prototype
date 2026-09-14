import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDataEnvironment } from "@/lib/data-environment";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  let body: { eventId?: unknown; participantId?: unknown; isLeader?: unknown };

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const eventId = stringValue(body.eventId);
  const participantId = stringValue(body.participantId);

  if (!isUuid(eventId) || !isUuid(participantId) || typeof body.isLeader !== "boolean") {
    return json({ ok: false, error: "Please check the event, participant, and designation." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const event = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("data_environment", getDataEnvironment())
    .maybeSingle();

  if (event.error) return json({ ok: false, error: event.error.message }, 500);
  if (!event.data) return json({ ok: false, error: "Event not found." }, 404);

  const participant = await supabase
    .from("participants")
    .update(body.isLeader
      ? { is_team_contact: true }
      : { is_team_contact: false, registration_role: "participant" })
    .eq("id", participantId)
    .eq("event_id", eventId)
    .select("id")
    .maybeSingle();

  if (participant.error) return json({ ok: false, error: participant.error.message }, 500);
  if (!participant.data) return json({ ok: false, error: "Participant not found." }, 404);

  revalidatePath(`/organizer/event/${eventId}/unassigned`);
  return json({ ok: true, isLeader: body.isLeader });
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
