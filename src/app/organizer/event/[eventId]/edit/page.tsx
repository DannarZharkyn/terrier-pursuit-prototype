import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { EditEventForm } from "@/components/edit-event-form";
import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createEventInvitationEmail } from "@/lib/email/event-invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  noStore();
  const supabase = createSupabaseAdminClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, name, game_code, starts_at, submission_deadline, rules, email_subject, email_body")
    .eq("id", params.eventId)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  const generatedEmail = createEventInvitationEmail({
    eventName: event.name as string,
    gameCode: (event.game_code as string | null) ?? "",
    startsAt: event.starts_at as string,
    submissionDeadline: event.submission_deadline as string,
    rules: (event.rules as string | null) ?? "",
    participantUrl: new URL(
      "/participant/welcome",
      process.env.NEXT_PUBLIC_APP_URL || "https://terrier-pursuit-prototype.vercel.app",
    ).toString(),
  });

  return (
    <OrganizerShell
      title="Edit Game"
      subtitle="Update the game name, start time, or rules."
    >
      <div className="mb-5">
        <PageBackLink
          href={`/organizer/event/${params.eventId}`}
          label="Back to Event"
        />
      </div>
      <EditEventForm
        event={{
          id: event.id as string,
          name: event.name as string,
          startsAt: (event.starts_at as string | null) ?? new Date().toISOString(),
          submissionDeadline: (event.submission_deadline as string | null) ?? new Date().toISOString(),
          rules: (event.rules as string | null) ?? "",
          emailSubject: (event.email_subject as string | null) ?? generatedEmail.subject,
          emailBody: (event.email_body as string | null) ?? generatedEmail.body,
        }}
      />
    </OrganizerShell>
  );
}
