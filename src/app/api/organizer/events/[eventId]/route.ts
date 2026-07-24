import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DeleteEventResponse =
  | {
      ok: true;
      deletedEventId: string;
    }
  | {
      ok: false;
      error: string;
    };

type UpdateEventResponse =
  | {
      ok: true;
      updatedEventId: string;
    }
  | {
      ok: false;
      error: string;
    };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: { eventId: string } },
) {
  const eventId = params.eventId;

  if (!uuidPattern.test(eventId)) {
    return json({ ok: false, error: "Event ID is invalid." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("events")
    .delete({ count: "exact" })
    .eq("id", eventId);

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  if (count === 0) {
    return json({ ok: false, error: "Event was not found." }, 404);
  }

  revalidatePath("/organizer/dashboard");
  revalidatePath(`/organizer/event/${eventId}`);

  return json({ ok: true, deletedEventId: eventId });
}

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  const eventId = params.eventId;

  if (!uuidPattern.test(eventId)) {
    return jsonUpdate({ ok: false, error: "Event ID is invalid." }, 400);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonUpdate({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  if (!isRecord(body)) {
    return jsonUpdate({ ok: false, error: "Please check the event details." }, 400);
  }

  const name = stringValue(body.name).trim();
  const startsAt = stringValue(body.startsAt).trim();
  const submissionDeadline = stringValue(body.submissionDeadline).trim();
  const rules = stringValue(body.rules).trim();
  const parsedStartsAt = new Date(startsAt);
  const parsedSubmissionDeadline = new Date(submissionDeadline);

  if (!name || name.length > 120) {
    return jsonUpdate({ ok: false, error: "Game name must be between 1 and 120 characters." }, 400);
  }

  if (!startsAt || Number.isNaN(parsedStartsAt.getTime())) {
    return jsonUpdate({ ok: false, error: "Please choose a valid game start date and time." }, 400);
  }

  if (!submissionDeadline || Number.isNaN(parsedSubmissionDeadline.getTime())) {
    return jsonUpdate({ ok: false, error: "Please choose a valid submission deadline." }, 400);
  }

  if (parsedSubmissionDeadline <= parsedStartsAt) {
    return jsonUpdate({ ok: false, error: "Submission deadline must be after the game start time." }, 400);
  }

  if (!rules) {
    return jsonUpdate({ ok: false, error: "Game rules are required." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      name,
      starts_at: parsedStartsAt.toISOString(),
      submission_deadline: parsedSubmissionDeadline.toISOString(),
      rules,
    })
    .eq("id", eventId)
    .select("id")
    .maybeSingle();

  if (error) {
    return jsonUpdate({ ok: false, error: error.message }, 500);
  }

  if (!data) {
    return jsonUpdate({ ok: false, error: "Event was not found." }, 404);
  }

  revalidatePath("/organizer/dashboard");
  revalidatePath(`/organizer/event/${eventId}`);
  revalidatePath(`/organizer/event/${eventId}/edit`);

  return jsonUpdate({ ok: true, updatedEventId: eventId });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function json(response: DeleteEventResponse, status = 200) {
  return NextResponse.json(response, { status });
}

function jsonUpdate(response: UpdateEventResponse, status = 200) {
  return NextResponse.json(response, { status });
}
