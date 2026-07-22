import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateEventForm } from "@/components/create-event-form";
import { OrganizerShell } from "@/components/organizer-shell";

export default function CreateEventPage() {
  return (
    <OrganizerShell
      title="Create Event"
      subtitle="Complete the event details and upload validated spreadsheets before publishing."
    >
      <div className="mb-5">
        <Link
          href="/organizer/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-bu-red focus:outline-none focus:ring-2 focus:ring-bu-red"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <CreateEventForm />
    </OrganizerShell>
  );
}
