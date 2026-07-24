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
        .select("id, storage_path, original_name, position")
        .eq("submission_id", submission.data.id)
        .order("position", { ascending: true })
    : { data: [], error: null };

  if (photos.error) {
    throw new Error(photos.error.message);
  }

  const photoRows = photos.data ?? [];
  const signedUrls = photoRows.length
    ? await supabase.storage
        .from("game-submissions")
        .createSignedUrls(photoRows.map((photo) => photo.storage_path as string), 3600)
    : { data: [], error: null };

  if (signedUrls.error) {
    throw new Error(signedUrls.error.message);
  }

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
    photos: photoRows.map((photo, index) => ({
      id: photo.id as string,
      originalName: photo.original_name as string,
      signedUrl: signedUrls.data?.[index]?.signedUrl ?? "",
    })).filter((photo) => photo.signedUrl),
  };
}
