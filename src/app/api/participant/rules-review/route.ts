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
  const context = await getContext(supabase, eventId, participantId, true);

  if (!context.ok) {
    return json({ ok: false, error: context.error }, context.status);
  }

  if (!context.review) {
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
    updateRequired: context.review.reviewed_version < context.rulesVersion,
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
  includeReview = false,
) {
  const selection = includeReview
    ? "id, events!participants_event_id_fkey!inner(rules, rules_version, rules_updated_at), participant_rules_reviews(reviewed_version)"
    : "id, events!participants_event_id_fkey!inner(rules, rules_version, rules_updated_at)";
  const participant = await supabase
    .from("participants")
    .select(selection)
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

  const row = participant.data as unknown as Record<string, unknown>;
  const event = firstRelated(row.events);
  if (!event) {
    return { ok: false as const, error: "Event not found.", status: 404 };
  }

  return {
    ok: true as const,
    rules: (event.rules as string | null) ?? "",
    rulesVersion: event.rules_version as number,
    updatedAt: event.rules_updated_at as string,
    review: includeReview
      ? rulesReview(firstRelated(row.participant_rules_reviews))
      : null,
  };
}

function rulesReview(value: Record<string, unknown> | null) {
  return value
    ? { reviewed_version: value.reviewed_version as number }
    : null;
}

function firstRelated(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return isRecord(value[0]) ? value[0] : null;
  }
  return isRecord(value) ? value : null;
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
