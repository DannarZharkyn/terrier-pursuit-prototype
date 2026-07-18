import { CreateEventForm } from "@/components/create-event-form";
import { OrganizerShell } from "@/components/organizer-shell";

export default function CreateEventPage() {
  return (
    <OrganizerShell
      title="Create Event"
      subtitle="Complete the event details and upload validated spreadsheets before publishing."
    >
      <CreateEventForm />
    </OrganizerShell>
  );
}
