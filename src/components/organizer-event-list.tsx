"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Trash2, Users, XCircle } from "lucide-react";

export type OrganizerDashboardEvent = {
  id: string;
  name: string;
  date: string;
  status: string;
  teams: number;
  gameCode: string;
};

type OrganizerEventListProps = {
  initialEvents: OrganizerDashboardEvent[];
};

export function OrganizerEventList({ initialEvents }: OrganizerEventListProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [deletingEventId, setDeletingEventId] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  async function handleDelete(event: OrganizerDashboardEvent) {
    const confirmed = window.confirm(
      `Permanently delete "${event.name}"? This will delete the event and related participants, locations, teams, team memberships, and submissions. Photo storage deletion is a future step because photos are not implemented yet.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingEventId(event.id);
    setSuccessMessage(undefined);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`/api/organizer/events/${event.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!result.ok) {
        setErrorMessage(result.error ?? "Could not delete event.");
        return;
      }

      setEvents((currentEvents) =>
        currentEvents.filter((currentEvent) => currentEvent.id !== event.id),
      );
      setSuccessMessage(`Deleted "${event.name}".`);
      router.refresh();
    } catch {
      setErrorMessage("Could not reach the delete API. Please try again.");
    } finally {
      setDeletingEventId(undefined);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-950">Existing Events</h2>
        <span className="text-sm font-semibold text-gray-500">
          {events.length} events
        </span>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <XCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        </div>
      ) : null}

      {events.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article key={event.id} className="card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-gray-950">
                    {event.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{event.date}</p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                  <span className="status-pill bg-white text-bu-dark">
                    {event.status}
                  </span>
                  <button
                    aria-label={`Delete ${event.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-bu-red transition hover:bg-bu-soft disabled:cursor-not-allowed disabled:text-gray-400"
                    type="button"
                    onClick={() => handleDelete(event)}
                    disabled={deletingEventId === event.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 rounded-lg border border-red-100 bg-white px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Game code</p>
                <p className="mt-1 font-mono text-2xl font-black tracking-[0.2em] text-bu-dark">{event.gameCode}</p>
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
      ) : (
        <div className="card p-5 text-sm font-semibold text-gray-600">
          No events have been published yet.
        </div>
      )}
    </section>
  );
}
