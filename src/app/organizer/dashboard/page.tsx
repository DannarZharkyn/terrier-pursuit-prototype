import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { CalendarPlus } from "lucide-react";
import { OrganizerEventList } from "@/components/organizer-event-list";
import { OrganizerShell } from "@/components/organizer-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function OrganizerDashboardPage() {
  noStore();
  const events = await getOrganizerEvents();

  return (
    <OrganizerShell
      title="Organizer Dashboard"
      subtitle="Track current hunts and start a new Terrier Pursuit event from one clean workspace."
    >
      <div className="mb-8">
        <Link
          href="/organizer/create-event"
          className="flex min-h-32 flex-col items-start justify-between gap-5 rounded-lg bg-bu-red p-5 text-white shadow-soft transition hover:bg-bu-dark sm:flex-row sm:items-center sm:p-6"
        >
          <span>
            <span className="block text-lg font-black">Create New Event</span>
            <span className="mt-1 block text-sm text-red-50">
              Upload rosters, clues, rules, and publish registration.
            </span>
          </span>
          <CalendarPlus className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
        </Link>
      </div>

      <OrganizerEventList initialEvents={events} />
    </OrganizerShell>
  );
}

async function getOrganizerEvents() {
  const supabase = createSupabaseAdminClient();

  const { data: eventRows, error: eventError } = await supabase
    .from("events")
    .select("id, name, status, starts_at, created_at")
    .order("created_at", { ascending: false });

  if (eventError) {
    throw new Error(`Could not load organizer events: ${eventError.message}`);
  }

  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .select("event_id");

  if (teamError) {
    throw new Error(`Could not load event team counts: ${teamError.message}`);
  }

  const teamCounts = new Map<string, number>();

  for (const team of teamRows ?? []) {
    const eventId = team.event_id as string;
    teamCounts.set(eventId, (teamCounts.get(eventId) ?? 0) + 1);
  }

  return (eventRows ?? []).map((event) => ({
    id: event.id as string,
    name: event.name as string,
    date: formatEventDate((event.starts_at as string | null) ?? event.created_at),
    status: formatStatus(event.status as string),
    teams: teamCounts.get(event.id as string) ?? 0,
  }));
}

function formatEventDate(value: string | null) {
  if (!value) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
