import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateParticipantJoinRequest } from "@/lib/participant-join/validation";
import type { ParticipantJoinResponse } from "@/lib/participant-join/types";
import { normalizeLegacyPunctuation } from "@/lib/text/normalize-legacy-punctuation";

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
  normalized_first_name: string;
  normalized_last_name: string;
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

  const eventResult = await getCachedPublishedEvent(
    validation.data.normalizedGameCode,
  );

  if (eventResult.error) {
    return json({ ok: false, error: eventResult.error }, 500);
  }

  if (!eventResult.event) {
    return json(
      {
        ok: false,
        error: "We could not find a matching participant for that game code.",
      },
      404,
    );
  }

  const event = eventResult.event;
  const supabase = createSupabaseAdminClient();
  const { data: participantData, error: participantError } = await supabase
    .from("participants")
    .select(
      "id, first_name, last_name, email, normalized_first_name, normalized_last_name",
    )
    .eq("event_id", event.id)
    .eq("normalized_email", validation.data.normalizedEmail)
    .maybeSingle();

  if (participantError) {
    return json({ ok: false, error: participantError.message }, 500);
  }

  const existingParticipant = participantData as ParticipantRow | null;
  const namesMatch = Boolean(
    existingParticipant &&
      existingParticipant.normalized_first_name ===
        validation.data.normalizedFirstName &&
      existingParticipant.normalized_last_name === validation.data.normalizedLastName,
  );

  if ((!existingParticipant || !namesMatch) && !validation.data.selfRegister) {
    return json(
      {
        ok: false,
        error: "We could not find a matching participant for that game code.",
      },
      404,
    );
  }

  if (existingParticipant && !namesMatch) {
    return json(
      {
        ok: false,
        error:
          "That email is already registered for this event. Sign in using the registered first and last name, or contact the organizer for help.",
      },
      409,
    );
  }

  let participant = existingParticipant ?? undefined;

  if (!participant) {
    const { data: insertedParticipant, error: insertError } = await supabase
      .from("participants")
      .insert({
        event_id: event.id,
        first_name: validation.data.firstName,
        last_name: validation.data.lastName,
        email: validation.data.email,
        normalized_first_name: validation.data.normalizedFirstName,
        normalized_last_name: validation.data.normalizedLastName,
        normalized_email: validation.data.normalizedEmail,
        joined_at: new Date().toISOString(),
      })
      .select(
        "id, first_name, last_name, email, normalized_first_name, normalized_last_name",
      )
      .single();

    if (insertError || !insertedParticipant) {
      return json(
        {
          ok: false,
          error: insertError?.message ?? "Could not create your registration.",
        },
        500,
      );
    }

    participant = insertedParticipant as ParticipantRow;
  }
  const locationResult = await getCachedEventClues(event.id);

  if (locationResult.error) {
    return json({ ok: false, error: locationResult.error }, 500);
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
      clues: (locationResult.locations as EventLocationRow[])
        .map((location) => normalizeLegacyPunctuation(location.clue).trim())
        .filter(Boolean),
    },
  });
}

const getCachedPublishedEvent = unstable_cache(
  async (gameCode: string) => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, name, game_code, status, starts_at, submission_deadline, rules")
      .eq("status", "published")
      .eq("game_code", gameCode)
      .maybeSingle();

    return {
      event: (data as EventRow | null) ?? null,
      error: error?.message,
    };
  },
  ["participant-published-event"],
  { revalidate: 5 },
);

const getCachedEventClues = unstable_cache(
  async (eventId: string) => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("event_locations")
      .select("clue")
      .eq("event_id", eventId)
      .order("position", { ascending: true });

    return {
      locations: (data ?? []) as EventLocationRow[],
      error: error?.message,
    };
  },
  ["participant-event-clues"],
  { revalidate: 5 },
);

function json(response: ParticipantJoinResponse, status = 200) {
  return NextResponse.json(response, { status });
}
