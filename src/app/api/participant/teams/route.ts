import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateTeamCode } from "@/lib/participant-teams/team-code";
import {
  validateCreateTeamRequest,
  validateCurrentTeamRequest,
} from "@/lib/participant-teams/validation";
import type {
  CreateTeamResponse,
  CurrentTeamResponse,
  ParticipantTeam,
  TeamMember,
} from "@/lib/participant-teams/types";

const maxTeamCodeAttempts = 5;

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  event_id: string;
};

type TeamRow = {
  id: string;
  name: string;
  team_code: string;
};

type TeamMembershipRow = {
  team_id: string;
  teams:
    | {
        id: string;
        name: string;
        team_code: string;
        event_id: string;
      }
    | {
        id: string;
        name: string;
        team_code: string;
        event_id: string;
      }[]
    | null;
};

type TeamMemberRow = {
  participants:
    | {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      }
    | {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      }[]
    | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const validation = validateCurrentTeamRequest({
    eventId: url.searchParams.get("eventId"),
    participantId: url.searchParams.get("participantId"),
  });

  if (!validation.data) {
    return jsonCurrentTeam(
      {
        ok: false,
        error: "Please check the team lookup request.",
        details: validation.errors,
      },
      400,
    );
  }

  const supabase = createSupabaseAdminClient();
  const team = await getParticipantTeam(
    supabase,
    validation.data.eventId,
    validation.data.participantId,
  );

  if (!team.ok) {
    return jsonCurrentTeam({ ok: false, error: team.error }, team.status);
  }

  return jsonCurrentTeam({ ok: true, team: team.team });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const validation = validateCreateTeamRequest(body);

  if (!validation.data) {
    return json(
      {
        ok: false,
        error: "Please check the team details.",
        details: validation.errors,
      },
      400,
    );
  }

  const supabase = createSupabaseAdminClient();

  const participant = await getPublishedEventParticipant(
    supabase,
    validation.data.eventId,
    validation.data.participantId,
  );

  if (!participant) {
    return json(
      {
        ok: false,
        error: "We could not find this participant in a published event.",
      },
      404,
    );
  }

  const alreadyOnTeam = await participantAlreadyHasTeam(
    supabase,
    validation.data.eventId,
    validation.data.participantId,
  );

  if (alreadyOnTeam.error) {
    return json({ ok: false, error: alreadyOnTeam.error }, 500);
  }

  if (alreadyOnTeam.value) {
    return json(
      {
        ok: false,
        error: "You are already on a team for this event.",
      },
      409,
    );
  }

  const teamResult = await insertTeamWithUniqueCode(supabase, {
    eventId: validation.data.eventId,
    participantId: validation.data.participantId,
    teamName: validation.data.teamName,
    normalizedTeamName: validation.data.normalizedTeamName,
  });

  if (!teamResult.ok) {
    return json({ ok: false, error: teamResult.error }, teamResult.status);
  }

  const membership = await supabase.from("team_memberships").insert({
    team_id: teamResult.team.id,
    participant_id: validation.data.participantId,
  });

  if (membership.error) {
    await supabase.from("teams").delete().eq("id", teamResult.team.id);
    return json(
      {
        ok: false,
        error: `Could not add the creator to the team: ${membership.error.message}`,
      },
      500,
    );
  }

  await supabase
    .from("participant_team_requests")
    .delete()
    .eq("event_id", validation.data.eventId)
    .eq("participant_id", validation.data.participantId);

  return json({
    ok: true,
    team: {
      id: teamResult.team.id,
      name: teamResult.team.name,
      teamCode: teamResult.team.team_code,
      members: [
        {
          id: participant.id,
          firstName: participant.first_name,
          lastName: participant.last_name,
          email: participant.email,
        },
      ],
    },
  });
}

function json(response: CreateTeamResponse, status = 200) {
  return NextResponse.json(response, { status });
}

function jsonCurrentTeam(response: CurrentTeamResponse, status = 200) {
  return NextResponse.json(response, { status });
}

async function getPublishedEventParticipant(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
) {
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("status", "published");

  if (eventError || !eventData || eventData.length !== 1) {
    return undefined;
  }

  const { data, error } = await supabase
    .from("participants")
    .select("id, first_name, last_name, email, event_id")
    .eq("id", participantId)
    .eq("event_id", eventId);

  if (error || !data || data.length !== 1) {
    return undefined;
  }

  return data[0] as unknown as ParticipantRow;
}

async function participantAlreadyHasTeam(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
) {
  const { data, error } = await supabase
    .from("team_memberships")
    .select("team_id, teams!inner(event_id)")
    .eq("participant_id", participantId)
    .eq("teams.event_id", eventId)
    .limit(1);

  if (error) {
    return { error: error.message };
  }

  return { value: Boolean(data?.length) };
}

async function getParticipantTeam(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  participantId: string,
): Promise<
  | { ok: true; team: ParticipantTeam | null }
  | { ok: false; error: string; status: number }
> {
  const { data, error } = await supabase
    .from("team_memberships")
    .select("team_id, teams!inner(id, name, team_code, event_id)")
    .eq("participant_id", participantId)
    .eq("teams.event_id", eventId)
    .limit(1);

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const membership = ((data ?? []) as unknown as TeamMembershipRow[])[0];
  const team = normalizeJoinedTeam(membership?.teams);

  if (!team) {
    return { ok: true, team: null };
  }

  const members = await getTeamMembers(supabase, team.id);

  if (!members.ok) {
    return members;
  }

  return {
    ok: true,
    team: {
      id: team.id,
      name: team.name,
      teamCode: team.team_code,
      members: members.members,
    },
  };
}

async function getTeamMembers(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  teamId: string,
): Promise<
  | { ok: true; members: TeamMember[] }
  | { ok: false; error: string; status: number }
> {
  const { data, error } = await supabase
    .from("team_memberships")
    .select("participants!inner(id, first_name, last_name, email)")
    .eq("team_id", teamId);

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const members = ((data ?? []) as unknown as TeamMemberRow[])
    .map((row) => normalizeJoinedParticipant(row.participants))
    .filter((participant): participant is NonNullable<typeof participant> =>
      Boolean(participant),
    )
    .map((participant) => ({
      id: participant.id,
      firstName: participant.first_name,
      lastName: participant.last_name,
      email: participant.email,
    }));

  return { ok: true, members };
}

async function insertTeamWithUniqueCode(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  team: {
    eventId: string;
    participantId: string;
    teamName: string;
    normalizedTeamName: string;
  },
): Promise<
  { ok: true; team: TeamRow } | { ok: false; error: string; status: number }
> {
  for (let attempt = 1; attempt <= maxTeamCodeAttempts; attempt += 1) {
    const teamCode = generateTeamCode();
    const { data, error } = await supabase
      .from("teams")
      .insert({
        event_id: team.eventId,
        name: team.teamName,
        normalized_name: team.normalizedTeamName,
        team_code: teamCode,
        created_by_participant_id: team.participantId,
        assignment_method: "participant_created",
      })
      .select("id, name, team_code")
      .single();

    if (!error && data) {
      return { ok: true, team: data as TeamRow };
    }

    if (isDuplicateTeamName(error)) {
      return {
        ok: false,
        error: "That team name is already taken for this event.",
        status: 409,
      };
    }

    if (isDuplicateTeamCode(error) && attempt < maxTeamCodeAttempts) {
      continue;
    }

    return {
      ok: false,
      error: error?.message ?? "Could not create team.",
      status: 500,
    };
  }

  return {
    ok: false,
    error: "Could not generate a unique team code.",
    status: 500,
  };
}

function isDuplicateTeamName(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "23505" &&
    (error.message?.includes("teams_event_id_normalized_name_key") ||
      error.message?.includes("normalized_name"))
  );
}

function isDuplicateTeamCode(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "23505" &&
    (error.message?.includes("teams_event_id_team_code_key") ||
      error.message?.includes("team_code"))
  );
}

function normalizeJoinedTeam(team: TeamMembershipRow["teams"]) {
  if (Array.isArray(team)) {
    return team[0];
  }

  return team ?? undefined;
}

function normalizeJoinedParticipant(participant: TeamMemberRow["participants"]) {
  if (Array.isArray(participant)) {
    return participant[0];
  }

  return participant ?? undefined;
}
