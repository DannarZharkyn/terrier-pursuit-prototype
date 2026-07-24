import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validatePublishEventRequest } from "@/lib/publish-event/validation";
import type { PublishEventResponse } from "@/lib/publish-event/types";
import { createEventInvitationEmail } from "@/lib/email/event-invitation";

const gameCodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const maxGameCodeAttempts = 5;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const validation = validatePublishEventRequest(body);

  if (!validation.data) {
    return json(
      {
        ok: false,
        error: "Publish request is invalid.",
        details: validation.errors,
      },
      400,
    );
  }

  const supabase = createSupabaseAdminClient();
  let eventId: string | undefined;

  try {
    const participantUrl = new URL(
      "/participant/welcome",
      process.env.NEXT_PUBLIC_APP_URL || request.url,
    ).toString();
    const eventResult = await insertEventWithUniqueGameCode(
      supabase,
      validation.data.event,
      participantUrl,
    );
    eventId = eventResult.eventId;

    const participantRows = validation.data.participants.map((participant) => ({
      event_id: eventId,
      first_name: participant.firstName,
      last_name: participant.lastName,
      email: participant.email,
      normalized_first_name: participant.normalizedFirstName,
      normalized_last_name: participant.normalizedLastName,
      normalized_email: participant.normalizedEmail,
    }));

    const participantInsert = await supabase.from("participants").insert(participantRows);

    if (participantInsert.error) {
      throw new Error(`Could not insert participants: ${participantInsert.error.message}`);
    }

    const locationRows = validation.data.locations.map((location) => ({
      event_id: eventId,
      position: location.position,
      landmark: location.landmark,
      normalized_landmark: location.normalizedLandmark,
      location_url: location.locationUrl,
      clue: location.clue,
      campus_population: location.campusPopulation,
    }));

    const locationInsert = await supabase.from("event_locations").insert(locationRows);

    if (locationInsert.error) {
      throw new Error(`Could not insert locations: ${locationInsert.error.message}`);
    }

    return json({
      ok: true,
      eventId,
      gameCode: eventResult.gameCode,
      participantCount: participantRows.length,
      locationCount: locationRows.length,
      emailTemplate: {
        recipients: validation.data.participants
          .map((participant) => participant.email)
          .join(", "),
        subject: eventResult.emailTemplate.subject,
        body: eventResult.emailTemplate.body,
      },
    });
  } catch (error) {
    if (eventId) {
      await supabase.from("events").delete().eq("id", eventId);
    }

    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not publish event.",
      },
      500,
    );
  }
}

function json(response: PublishEventResponse, status = 200) {
  return NextResponse.json(response, { status });
}

async function insertEventWithUniqueGameCode(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  event: {
    name: string;
    startsAt: string;
    submissionDeadline: string;
    rules: string;
  },
  participantUrl: string,
) {
  for (let attempt = 1; attempt <= maxGameCodeAttempts; attempt += 1) {
    const gameCode = generateGameCode();
    const emailTemplate = createEventInvitationEmail({
      eventName: event.name,
      gameCode,
      startsAt: event.startsAt,
      submissionDeadline: event.submissionDeadline,
      rules: event.rules,
      participantUrl,
    });
    const { data, error } = await supabase
      .from("events")
      .insert({
        name: event.name,
        game_code: gameCode,
        status: "published",
        starts_at: event.startsAt,
        submission_deadline: event.submissionDeadline,
        data_deletion_scheduled_at: getDataDeletionScheduledAt(event.submissionDeadline),
        rules: event.rules,
        email_subject: emailTemplate.subject,
        email_body: emailTemplate.body,
      })
      .select("id")
      .single();

    if (!error && data) {
      return {
        eventId: data.id as string,
        gameCode,
        emailTemplate,
      };
    }

    if (error?.code !== "23505" || attempt === maxGameCodeAttempts) {
      throw new Error(error?.message ?? "Could not create event.");
    }
  }

  throw new Error("Could not generate a unique game code.");
}

function generateGameCode() {
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += gameCodeCharacters[Math.floor(Math.random() * gameCodeCharacters.length)];
  }

  return code;
}

function getDataDeletionScheduledAt(submissionDeadline: string) {
  const date = new Date(submissionDeadline);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + 7);
  return date.toISOString();
}
