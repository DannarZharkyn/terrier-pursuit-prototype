import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDataEnvironment } from "@/lib/data-environment";

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
    .eq("id", eventId)
    .eq("data_environment", getDataEnvironment());

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
  const disclaimer = stringValue(body.disclaimer).trim();
  const emailSubject = stringValue(body.emailSubject).trim();
  const emailBody = stringValue(body.emailBody).trim();
  const locations = Array.isArray(body.locations) ? body.locations : [];
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

  if (!disclaimer) {
    return jsonUpdate({ ok: false, error: "Participant disclaimer is required." }, 400);
  }

  if (!emailSubject || emailSubject.length > 200) {
    return jsonUpdate({ ok: false, error: "Email subject must be between 1 and 200 characters." }, 400);
  }

  if (!emailBody) {
    return jsonUpdate({ ok: false, error: "Email message is required." }, 400);
  }

  if (!locations.length || locations.some((location) => !isValidLocation(location))) {
    return jsonUpdate({ ok: false, error: "Choose at least one complete event location." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const currentEvent = await supabase
    .from("events")
    .select("name, starts_at, submission_deadline, rules, disclaimer_text, disclaimer_locked_at")
    .eq("id", eventId)
    .eq("data_environment", getDataEnvironment())
    .maybeSingle();

  if (currentEvent.error) {
    return jsonUpdate({ ok: false, error: currentEvent.error.message }, 500);
  }

  if (!currentEvent.data) {
    return jsonUpdate({ ok: false, error: "Event was not found." }, 404);
  }

  const currentDisclaimer = stringValue(currentEvent.data.disclaimer_text);
  const disclaimerLocked = Boolean(currentEvent.data.disclaimer_locked_at);

  if (disclaimerLocked && disclaimer !== currentDisclaimer.trim()) {
    return jsonUpdate(
      {
        ok: false,
        error:
          "The disclaimer is locked because a participant has already accepted it.",
      },
      409,
    );
  }

  const disclaimerToSave = disclaimerLocked ? currentDisclaimer : disclaimer;

  const locationsEditable = new Date(currentEvent.data.starts_at).getTime() > Date.now();
  if (locationsEditable) {
    const replaceResult = await supabase.rpc("replace_event_locations", {
      target_event_id: eventId,
      next_locations: locations.map((location) => ({
        landmark: stringValue(location.landmark).trim(),
        location_url: stringValue(location.locationUrl).trim(),
        clue: stringValue(location.clue).trim(),
        campus_population: stringValue(location.campusPopulation).trim(),
      })),
    });
    if (replaceResult.error) {
      return jsonUpdate({ ok: false, error: replaceResult.error.message }, 409);
    }
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      name,
      starts_at: parsedStartsAt.toISOString(),
      submission_deadline: parsedSubmissionDeadline.toISOString(),
      rules,
      disclaimer_text: disclaimerToSave,
      email_subject: emailSubject,
      email_body: emailBody,
    })
    .eq("id", eventId)
    .eq("data_environment", getDataEnvironment())
    .select("id")
    .maybeSingle();

  if (error) {
    return jsonUpdate({ ok: false, error: error.message }, 500);
  }

  if (!data) {
    return jsonUpdate({ ok: false, error: "Event was not found." }, 404);
  }
  const rulesChanged = rules !== currentEvent.data.rules;
  const otherParticipantDetailsChanged =
    name !== currentEvent.data.name ||
    parsedStartsAt.toISOString() !== currentEvent.data.starts_at ||
    parsedSubmissionDeadline.toISOString() !== currentEvent.data.submission_deadline;

  if (!rulesChanged && otherParticipantDetailsChanged) {
    await supabase.from("participant_realtime_signals").insert({
      event_id: eventId,
      participant_id: null,
      kind: "rules_updated",
    });
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

function isValidLocation(value: unknown) {
  if (!isRecord(value)) return false;
  const url = stringValue(value.locationUrl).trim();
  return Boolean(stringValue(value.landmark).trim() && stringValue(value.clue).trim()
    && stringValue(value.campusPopulation).trim() && url.startsWith("https://"));
}

function json(response: DeleteEventResponse, status = 200) {
  return NextResponse.json(response, { status });
}

function jsonUpdate(response: UpdateEventResponse, status = 200) {
  return NextResponse.json(response, { status });
}
