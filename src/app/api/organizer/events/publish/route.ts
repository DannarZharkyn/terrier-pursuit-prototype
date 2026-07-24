import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validatePublishEventRequest } from "@/lib/publish-event/validation";
import type { PublishEventResponse } from "@/lib/publish-event/types";
import { createEventInvitationEmail } from "@/lib/email/event-invitation";
import { isEmailConfigured, sendEmail } from "@/lib/email/resend";

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
    const eventResult = await insertEventWithUniqueGameCode(supabase, validation.data.event);
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

    const participantInsert = await supabase
      .from("participants")
      .insert(participantRows)
      .select("id, first_name, last_name, email");

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

    const participantUrl = new URL(
      "/participant/welcome",
      process.env.NEXT_PUBLIC_APP_URL || request.url,
    ).toString();
    const email = await sendEventInvitations({
      supabase,
      eventId,
      eventName: validation.data.event.name,
      gameCode: eventResult.gameCode,
      startsAt: validation.data.event.startsAt,
      participantUrl,
      participants: (participantInsert.data ?? []) as ParticipantEmailRow[],
    });

    return json({
      ok: true,
      eventId,
      gameCode: eventResult.gameCode,
      participantCount: participantRows.length,
      locationCount: locationRows.length,
      email,
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

type ParticipantEmailRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type InvitationEmailRow = {
  id: string;
  participant_id: string;
};

async function sendEventInvitations({
  supabase,
  eventId,
  eventName,
  gameCode,
  startsAt,
  participantUrl,
  participants,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  eventId: string;
  eventName: string;
  gameCode: string;
  startsAt: string;
  participantUrl: string;
  participants: ParticipantEmailRow[];
}) {
  if (!isEmailConfigured()) {
    return {
      status: "not_configured" as const,
      sentCount: 0,
      failedCount: 0,
    };
  }

  const invitationInsert = await supabase
    .from("event_invitation_emails")
    .insert(participants.map((participant) => ({
      event_id: eventId,
      participant_id: participant.id,
      recipient_email: participant.email,
      status: "pending",
    })))
    .select("id, participant_id");

  if (invitationInsert.error) {
    return {
      status: "completed" as const,
      sentCount: 0,
      failedCount: participants.length,
    };
  }

  const invitationsByParticipant = new Map(
    ((invitationInsert.data ?? []) as InvitationEmailRow[]).map((invitation) => [
      invitation.participant_id,
      invitation,
    ]),
  );
  const results = await Promise.all(participants.map(async (participant) => {
    const invitation = invitationsByParticipant.get(participant.id);

    if (!invitation) {
      return false;
    }

    try {
      const message = createEventInvitationEmail({
        firstName: participant.first_name,
        eventName,
        gameCode,
        startsAt,
        participantUrl,
      });
      const providerMessageId = await sendEmail({
        to: participant.email,
        ...message,
        idempotencyKey: `event-invitation-${invitation.id}`,
      });
      await supabase
        .from("event_invitation_emails")
        .update({
          status: "sent",
          provider_message_id: providerMessageId,
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", invitation.id);
      return true;
    } catch (error) {
      await supabase
        .from("event_invitation_emails")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message : "Email could not be sent.",
        })
        .eq("id", invitation.id);
      return false;
    }
  }));
  const sentCount = results.filter(Boolean).length;

  return {
    status: "completed" as const,
    sentCount,
    failedCount: participants.length - sentCount,
  };
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
) {
  for (let attempt = 1; attempt <= maxGameCodeAttempts; attempt += 1) {
    const gameCode = generateGameCode();
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
      })
      .select("id")
      .single();

    if (!error && data) {
      return {
        eventId: data.id as string,
        gameCode,
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
