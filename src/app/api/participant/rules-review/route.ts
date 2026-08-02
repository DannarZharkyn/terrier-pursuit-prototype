import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
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
  const [context, review] = await Promise.all([
    getContext(supabase, eventId, participantId),
    supabase
      .from("participant_rules_reviews")
      .select("reviewed_version")
      .eq("event_id", eventId)
      .eq("participant_id", participantId)
      .maybeSingle(),
  ]);

  if (!context.ok) {
    return json({ ok: false, error: context.error }, context.status);
  }

  if (review.error) {
    return json({ ok: false, error: review.error.message }, 500);
  }

  if (!review.data) {
    const created = await supabase
      .from("participant_rules_reviews")
      .insert({
        event_id: eventId,
        participant_id: participantId,
        reviewed_version: context.rulesVersion,
      });

    if (created.error && created.error.code !== "23505") {
      return json({ ok: false, error: created.error.message }, 500);
    }

    return json({ ok: true, updateRequired: false });
  }

  return json({
    ok: true,
    updateRequired: review.data.reviewed_version < context.rulesVersion,
    rules: context.rules,
    rulesVersion: context.rulesVersion,
    updatedAt: context.updatedAt,
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
    return json({ ok: false, error: "Please check the rules review." }, 400);
  }

  const eventId = stringValue(body.eventId);
  const participantId = stringValue(body.participantId);
  const reviewedVersion =
    typeof body.reviewedVersion === "number" ? body.reviewedVersion : 0;

  if (
    !uuidPattern.test(eventId) ||
    !uuidPattern.test(participantId) ||
    !Number.isInteger(reviewedVersion) ||
    reviewedVersion < 1
  ) {
    return json({ ok: false, error: "Event or participant ID is invalid." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const context = await getContext(supabase, eventId, participantId);

  if (!context.ok) {
    return json({ ok: false, error: context.error }, context.status);
  }

  if (reviewedVersion !== context.rulesVersion) {
    return json(
      {
        ok: false,
        updateRequired: true,
        error: "The rules changed again. Please review the latest version.",
        rules: context.rules,
        rulesVersion: context.rulesVersion,
        updatedAt: context.updatedAt,
      },
      409,
    );
  }

  const saved = await supabase
    .from("participant_rules_reviews")
    .upsert(
      {
        event_id: eventId,
        participant_id: participantId,
        reviewed_version: reviewedVersion,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "event_id,participant_id" },
    );

  if (saved.error) {
    return json({ ok: false, error: saved.error.message }, 500);
  }

  return json({ ok: true, reviewedVersion });
}

async function getContext(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
) {
  const [participant, event] = await Promise.all([
    supabase
      .from("participants")
      .select("id")
      .eq("id", participantId)
      .eq("event_id", eventId)
      .maybeSingle(),
    getCachedRulesEvent(eventId),
  ]);

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

  if (event.error) {
    return { ok: false as const, error: event.error, status: 500 };
  }

  if (!event.event) {
    return { ok: false as const, error: "Event not found.", status: 404 };
  }

  return {
    ok: true as const,
    rules: event.event.rules,
    rulesVersion: event.event.rulesVersion,
    updatedAt: event.event.updatedAt,
  };
}

const getCachedRulesEvent = unstable_cache(
  async (eventId: string) => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("events")
      .select("rules, rules_version, rules_updated_at")
      .eq("id", eventId)
      .maybeSingle();

    return {
      event: data
        ? {
            rules: (data.rules as string | null) ?? "",
            rulesVersion: data.rules_version as number,
            updatedAt: data.rules_updated_at as string,
          }
        : null,
      error: error?.message,
    };
  },
  ["participant-rules-event"],
  { revalidate: 5 },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function json(response: Record<string, unknown>, status = 200) {
  return NextResponse.json(response, { status });
}
