import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateParticipantJoinRequest } from "@/lib/participant-join/validation";
import type { ParticipantJoinResponse } from "@/lib/participant-join/types";

type EventRow = {
  id: string;
  name: string;
  game_code: string | null;
  status: string;
  starts_at: string | null;
  submission_deadline: string | null;
  rules: string | null;
};

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type EventLocationRow = {
  clue: string;
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const validation = validateParticipantJoinRequest(body);

  if (!validation.data) {
    return json(
      {
        ok: false,
        error: "Please check the information you entered.",
        details: validation.errors,
      },
      400,
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("id, name, game_code, status, starts_at, submission_deadline, rules")
    .eq("status", "published")
    .eq("game_code", validation.data.normalizedGameCode);

  if (eventError) {
    return json({ ok: false, error: eventError.message }, 500);
  }

  if (!eventData || eventData.length !== 1) {
    return json(
      {
        ok: false,
        error: "We could not find a matching participant for that game code.",
      },
      404,
    );
  }

  const event = eventData[0] as EventRow;
  const { data: participantData, error: participantError } = await supabase
    .from("participants")
    .select("id, first_name, last_name, email")
    .eq("event_id", event.id)
    .eq("normalized_first_name", validation.data.normalizedFirstName)
    .eq("normalized_last_name", validation.data.normalizedLastName)
    .eq("normalized_email", validation.data.normalizedEmail);

  if (participantError) {
    return json({ ok: false, error: participantError.message }, 500);
  }

  if (!participantData || participantData.length !== 1) {
    return json(
      {
        ok: false,
        error: "We could not find a matching participant for that game code.",
      },
      404,
    );
  }

  const participant = participantData[0] as ParticipantRow;
  const { data: locationData, error: locationError } = await supabase
    .from("event_locations")
    .select("clue")
    .eq("event_id", event.id)
    .order("position", { ascending: true });

  if (locationError) {
    return json({ ok: false, error: locationError.message }, 500);
  }

  return json({
    ok: true,
    participant: {
      id: participant.id,
      firstName: participant.first_name,
      lastName: participant.last_name,
      email: participant.email,
    },
    event: {
      id: event.id,
      name: event.name,
      gameCode: event.game_code ?? validation.data.normalizedGameCode,
      startsAt: event.starts_at ?? "",
      submissionDeadline: event.submission_deadline ?? "",
      rules: event.rules ?? "",
      clues: ((locationData ?? []) as unknown as EventLocationRow[])
        .map((location) => location.clue.trim())
        .filter(Boolean),
    },
  });
}

function json(response: ParticipantJoinResponse, status = 200) {
  return NextResponse.json(response, { status });
}
