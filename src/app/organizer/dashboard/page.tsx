import Link from "next/link";
import { ArrowRight, CalendarPlus, Users } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
import { events } from "@/lib/mock-data";

export default function OrganizerDashboardPage() {
  return (
    <OrganizerShell
      title="Organizer Dashboard"
      subtitle="Track current hunts and start a new Terrier Pursuit event from one clean workspace."
    >
      <div className="mb-8">
        <Link
          href="/organizer/create-event"
          className="flex min-h-32 items-center justify-between rounded-lg bg-bu-red p-6 text-white shadow-soft transition hover:bg-bu-dark"
        >
          <span>
            <span className="block text-lg font-black">Create New Event</span>
            <span className="mt-1 block text-sm text-red-50">
              Upload rosters, clues, rules, and publish registration.
            </span>
          </span>
          <CalendarPlus className="h-10 w-10" />
        </Link>
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-950">Existing Events</h2>
          <span className="text-sm font-semibold text-gray-500">
            {events.length} events
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article key={event.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-gray-950">
                    {event.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{event.date}</p>
                </div>
                <span className="status-pill bg-white text-bu-dark">
                  {event.status}
                </span>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="h-4 w-4 text-bu-red" />
                {event.teams} teams
              </div>
              <Link
                href={`/organizer/event/${event.id}`}
                className="btn-secondary mt-6 w-full"
              >
                View Event
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </OrganizerShell>
  );
}
