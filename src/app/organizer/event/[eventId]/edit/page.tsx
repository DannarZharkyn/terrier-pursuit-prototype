import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { EditEventForm } from "@/components/edit-event-form";
import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createEventInvitationEmail, replaceEventInvitationUrl } from "@/lib/email/event-invitation";
import { createEventParticipantUrl } from "@/lib/events/participant-url";
import { getApplicationBaseUrl } from "@/lib/app-url";

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
    .select("id, name, game_code, starts_at, submission_deadline, rules, disclaimer_text, disclaimer_locked_at, email_subject, email_body")
    .eq("id", params.eventId)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  const participantUrl = createEventParticipantUrl(
    getApplicationBaseUrl(),
    (event.game_code as string | null) ?? "",
    event.id as string,
  );
  const generatedEmail = createEventInvitationEmail({
    eventName: event.name as string,
    gameCode: (event.game_code as string | null) ?? "",
    startsAt: event.starts_at as string,
    submissionDeadline: event.submission_deadline as string,
    rules: (event.rules as string | null) ?? "",
    participantUrl,
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
          disclaimer: (event.disclaimer_text as string | null) ?? "",
          disclaimerLocked: Boolean(event.disclaimer_locked_at),
          emailSubject: (event.email_subject as string | null) ?? generatedEmail.subject,
          emailBody: replaceEventInvitationUrl(
            (event.email_body as string | null) ?? generatedEmail.body,
            participantUrl,
          ),
        }}
      />
    </OrganizerShell>
  );
}
