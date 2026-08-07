import { CreateEventForm } from "@/components/create-event-form";
import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";
import { builtInPlatformTemplates } from "@/lib/templates/defaults";
import { getPlatformTemplates } from "@/lib/templates/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreateEventPage() {
  const templates = await getPlatformTemplates().catch(() => builtInPlatformTemplates);

  return (
    <OrganizerShell
      title="Create Event"
      subtitle="Complete the event details and upload validated spreadsheets before publishing."
    >
      <div className="mb-5">
        <PageBackLink href="/organizer/dashboard" label="Back to Dashboard" />
      </div>
      <CreateEventForm initialTemplates={templates} />
    </OrganizerShell>
  );
}
