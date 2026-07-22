import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateDeleteTeamRequest } from "@/lib/participant-teams/validation";
import type { DeleteTeamResponse } from "@/lib/participant-teams/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TeamRow = {
  id: string;
  event_id: string;
};

type ParticipantRow = {
  id: string;
  event_id: string;
};

export async function DELETE(
  request: Request,
  { params }: { params: { teamId: string } },
) {
  const teamId = params.teamId;

  if (!uuidPattern.test(teamId)) {
    return json({ ok: false, error: "Team ID is invalid." }, 400);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  const validation = validateDeleteTeamRequest(body);

  if (!validation.data) {
    return json(
      {
        ok: false,
        error: "Please check the delete request.",
        details: validation.errors,
      },
      400,
    );
  }

  const supabase = createSupabaseAdminClient();
  const [teamResult, participantResult] = await Promise.all([
    supabase
      .from("teams")
      .select("id, event_id")
      .eq("id", teamId),
    supabase
      .from("participants")
      .select("id, event_id")
      .eq("id", validation.data.participantId),
  ]);

  if (teamResult.error) {
    return json({ ok: false, error: teamResult.error.message }, 500);
  }

  if (participantResult.error) {
    return json({ ok: false, error: participantResult.error.message }, 500);
  }

  const teams = (teamResult.data ?? []) as unknown as TeamRow[];
  const participants = (participantResult.data ?? []) as unknown as ParticipantRow[];

  if (teams.length !== 1) {
    return json({ ok: false, error: "Team was not found." }, 404);
  }

  if (participants.length !== 1) {
    return json({ ok: false, error: "Participant was not found." }, 404);
  }

  const team = teams[0];
  const participant = participants[0];

  if (team.event_id !== participant.event_id) {
    return json(
      {
        ok: false,
        error: "The participant and team must belong to the same event.",
      },
      400,
    );
  }

  const { data: membership, error: membershipLookupError } = await supabase
    .from("team_memberships")
    .select("team_id")
    .eq("team_id", teamId)
    .eq("participant_id", validation.data.participantId)
    .maybeSingle();

  if (membershipLookupError) {
    return json({ ok: false, error: membershipLookupError.message }, 500);
  }

  if (!membership) {
    return json({ ok: false, error: "You are not a member of this team." }, 404);
  }

  const { error: membershipDeleteError } = await supabase
    .from("team_memberships")
    .delete()
    .eq("team_id", teamId)
    .eq("participant_id", validation.data.participantId);

  if (membershipDeleteError) {
    return json({ ok: false, error: membershipDeleteError.message }, 500);
  }

  const { data: remainingMemberships, error: remainingMembershipsError } = await supabase
    .from("team_memberships")
    .select("participant_id")
    .eq("team_id", teamId)
    .limit(1);

  if (remainingMembershipsError) {
    return json({ ok: false, error: remainingMembershipsError.message }, 500);
  }

  const teamDeleted = (remainingMemberships ?? []).length === 0;

  if (teamDeleted) {
    const { error: teamDeleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (teamDeleteError) {
      return json({ ok: false, error: teamDeleteError.message }, 500);
    }
  }

  revalidatePath("/participant/team-options");
  revalidatePath("/participant/team");
  revalidatePath(`/organizer/event/${team.event_id}`);
  revalidatePath(`/organizer/event/${team.event_id}/unassigned`);

  return json({ ok: true, leftTeamId: teamId, teamDeleted });
}

function json(response: DeleteTeamResponse, status = 200) {
  return NextResponse.json(response, { status });
}
