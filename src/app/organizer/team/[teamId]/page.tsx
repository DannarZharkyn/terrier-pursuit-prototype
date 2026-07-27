import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { OrganizerShell } from "@/components/organizer-shell";
import { OrganizerTeamReviewContent } from "@/components/organizer-team-review-content";
import { PageBackLink } from "@/components/page-back-link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamReviewPage({
  params,
}: {
  params: { teamId: string };
}) {
  noStore();
  const team = await getTeamReview(params.teamId);

  if (!team) {
    notFound();
  }

  return (
    <OrganizerShell
      title="Team Review"
      subtitle="Review the team's submitted pictures."
    >
      <div className="mb-5">
        <PageBackLink
          href={`/organizer/event/${team.eventId}`}
          label="Back to Event"
        />
      </div>
      <OrganizerTeamReviewContent team={team} />
    </OrganizerShell>
  );
}

async function getTeamReview(teamId: string) {
  const supabase = createSupabaseAdminClient();
  const teamResult = await supabase
    .from("teams")
    .select("id, name, event_id")
    .eq("id", teamId)
    .maybeSingle();

  if (teamResult.error || !teamResult.data) {
    return undefined;
  }

  const memberships = await supabase
    .from("team_memberships")
    .select("participants(id, first_name, last_name, email)")
    .eq("team_id", teamId);
  const submission = await supabase
    .from("team_hunt_submissions")
    .select("id, status")
    .eq("team_id", teamId)
    .maybeSingle();

  if (memberships.error || submission.error) {
    throw new Error(memberships.error?.message || submission.error?.message);
  }

  const photos = submission.data
    ? await supabase
        .from("team_submission_photos")
        .select(
          "id, storage_path, original_name, position, created_at, event_locations(clue), participants(first_name, last_name)",
        )
        .eq("submission_id", submission.data.id)
        .order("position", { ascending: true })
    : { data: [], error: null };

  if (photos.error) {
    throw new Error(photos.error.message);
  }

  const photoRows = photos.data ?? [];
  const signedPhotos = await Promise.all(
    photoRows.map(async (photo) => {
      const preview = await supabase.storage
        .from("game-submissions")
        .createSignedUrl(photo.storage_path as string, 3600);
      const download = await supabase.storage
        .from("game-submissions")
        .createSignedUrl(photo.storage_path as string, 3600, {
          download: photo.original_name as string,
        });

      if (preview.error || download.error) {
        throw new Error(preview.error?.message || download.error?.message);
      }

      const location = Array.isArray(photo.event_locations)
        ? photo.event_locations[0]
        : photo.event_locations;
      const uploader = Array.isArray(photo.participants)
        ? photo.participants[0]
        : photo.participants;

      return {
        id: photo.id as string,
        originalName: photo.original_name as string,
        signedUrl: preview.data.signedUrl,
        downloadUrl: download.data.signedUrl,
        clue: location?.clue as string | undefined,
        position: photo.position as number,
        uploadedAt: photo.created_at as string,
        uploadedBy: uploader
          ? `${uploader.first_name} ${uploader.last_name}`
          : "Former team member",
      };
    }),
  );

  return {
    name: teamResult.data.name as string,
    eventId: teamResult.data.event_id as string,
    status: submission.data ? String(submission.data.status) : "Not submitted",
    members: (memberships.data ?? []).flatMap((membership) => {
      const participant = Array.isArray(membership.participants)
        ? membership.participants[0]
        : membership.participants;
      return participant ? [{
        id: participant.id as string,
        name: `${participant.first_name} ${participant.last_name}`,
        email: participant.email as string,
      }] : [];
    }),
    photos: signedPhotos,
  };
}
