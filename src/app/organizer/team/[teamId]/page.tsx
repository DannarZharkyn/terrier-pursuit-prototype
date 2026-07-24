import { FolderOpen, ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { OrganizerShell } from "@/components/organizer-shell";
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
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card p-5">
          <h2 className="text-xl font-black text-gray-950">{team.name}</h2>
          <p className="mt-5 text-sm font-semibold text-gray-500">Members</p>
          <ul className="mt-3 space-y-2">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700"
              >
                {member.name}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-sm font-bold text-gray-950">Submitted Pictures</p>
                <p className="text-xs text-gray-500">
                  {team.photos.length} file{team.photos.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-gray-500">
            Status: {team.status}
          </p>
        </aside>
        <div className="card p-5">
          {team.photos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {team.photos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.signedUrl}
                    alt={photo.originalName}
                    className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <p className="truncate px-3 py-2 text-xs font-semibold text-gray-600">
                    {photo.originalName}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <ImageIcon className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-600">
                This team has not submitted pictures yet.
              </p>
            </div>
          )}
        </div>
      </section>
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
    .select("participants(id, first_name, last_name)")
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
      }] : [];
    }),
    photos: photoRows.map((photo, index) => ({
      id: photo.id as string,
      originalName: photo.original_name as string,
      signedUrl: signedUrls.data?.[index]?.signedUrl ?? "",
    })).filter((photo) => photo.signedUrl),
  };
}
