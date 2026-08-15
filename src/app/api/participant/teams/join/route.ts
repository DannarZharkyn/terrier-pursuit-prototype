import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDataEnvironment } from "@/lib/data-environment";
import { validateJoinTeamRequest } from "@/lib/participant-teams/validation";
import type {
  JoinTeamResponse,
  ParticipantTeam,
  TeamMember,
} from "@/lib/participant-teams/types";

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
  event_id: string;
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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const validation = validateJoinTeamRequest(body);

  if (!validation.data) {
    return json(
      {
        ok: false,
        error: "Please check the team code.",
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

  const team = await getTeamByCode(
    supabase,
    validation.data.eventId,
    validation.data.teamCode,
  );

  if (!team.ok) {
    return json({ ok: false, error: team.error }, team.status);
  }

  const membership = await supabase.from("team_memberships").insert({
    team_id: team.team.id,
    participant_id: participant.id,
  });

  if (membership.error) {
    return json(
      {
        ok: false,
        error: `Could not join this team: ${membership.error.message}`,
      },
      500,
    );
  }

  const joinedTeam = await buildParticipantTeam(supabase, team.team);

  if (!joinedTeam.ok) {
    return json({ ok: false, error: joinedTeam.error }, joinedTeam.status);
  }

  await supabase
    .from("participant_team_requests")
    .delete()
    .eq("event_id", validation.data.eventId)
    .eq("participant_id", participant.id);

  return json({ ok: true, team: joinedTeam.team });
}

function json(response: JoinTeamResponse, status = 200) {
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
    .eq("status", "published")
    .eq("data_environment", getDataEnvironment());

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

async function getTeamByCode(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  teamCode: string,
): Promise<{ ok: true; team: TeamRow } | { ok: false; error: string; status: number }> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, team_code, event_id")
    .eq("event_id", eventId)
    .eq("team_code", teamCode);

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  if (!data || data.length !== 1) {
    return {
      ok: false,
      error: "We could not find a team with that code for this event.",
      status: 404,
    };
  }

  return { ok: true, team: data[0] as TeamRow };
}

async function buildParticipantTeam(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  team: TeamRow,
): Promise<
  | { ok: true; team: ParticipantTeam }
  | { ok: false; error: string; status: number }
> {
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

function normalizeJoinedParticipant(participant: TeamMemberRow["participants"]) {
  if (Array.isArray(participant)) {
    return participant[0];
  }

  return participant ?? undefined;
}
