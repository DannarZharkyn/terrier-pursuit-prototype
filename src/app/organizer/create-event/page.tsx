import { CreateEventForm } from "@/components/create-event-form";
import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";

export default function CreateEventPage() {
  return (
    <OrganizerShell
      title="Create Event"
      subtitle="Complete the event details and upload validated spreadsheets before publishing."
    >
      <div className="mb-5">
        <PageBackLink href="/organizer/dashboard" label="Back to Dashboard" />
      </div>
      <CreateEventForm />
    </OrganizerShell>
  );
}
