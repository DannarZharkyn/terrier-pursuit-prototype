"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { EventEmailTemplate } from "@/components/event-email-template";
import { readCreateEventDraft } from "@/lib/imports/create-event-draft";
import type {
  PublishEventResponse,
  PublishEventSuccess,
} from "@/lib/publish-event/types";

export function CreateEventPublishActions() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState<PublishEventSuccess>();
  const [error, setError] = useState<string>();
  const [details, setDetails] = useState<string[]>();
  const [deleteMessage, setDeleteMessage] = useState<string>();

  async function handlePublish() {
    const draft = readCreateEventDraft();

    setSuccess(undefined);
    setError(undefined);
    setDetails(undefined);
    setDeleteMessage(undefined);

    if (!draft) {
      setError("Uploaded file details were not found. Go back and upload both spreadsheets again.");
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch("/api/organizer/events/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: draft.event,
          participants: draft.participants,
          locations: draft.locations,
          templates: draft.templates,
        }),
      });
      const result = (await response.json()) as PublishEventResponse;

      if (!result.ok) {
        setError(result.error);
        setDetails(result.details);
        return;
      }

      setSuccess(result);
    } catch {
      setError("Could not reach the publish API. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDeleteEvent() {
    if (!success) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this event from Supabase? This will also delete its participants, locations, teams, team memberships, and submissions.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(undefined);
    setDetails(undefined);
    setDeleteMessage(undefined);

    try {
      const response = await fetch(`/api/organizer/events/${success.eventId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as {
        ok: boolean;
        deletedEventId?: string;
        error?: string;
      };

      if (!result.ok) {
        setError(result.error ?? "Could not delete event.");
        return;
      }

      setDeleteMessage("Event deleted from Supabase.");
      setSuccess(undefined);
    } catch {
      setError("Could not reach the delete API. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Event published successfully.
          </div>
          <dl className="mt-3 grid gap-3 text-sm text-green-900 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Game code</dt>
              <dd className="text-xl font-black tracking-normal">{success.gameCode}</dd>
            </div>
            <div>
              <dt className="font-semibold">Event ID</dt>
              <dd className="break-all">{success.eventId}</dd>
            </div>
            <div>
              <dt className="font-semibold">Participants saved</dt>
              <dd>{success.participantCount}</dd>
            </div>
            <div>
              <dt className="font-semibold">Locations saved</dt>
              <dd>{success.locationCount}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-green-200 pt-4">
            <button
              className="text-sm font-bold text-red-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-gray-500"
              type="button"
              onClick={handleDeleteEvent}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting event..." : "Delete this event for development"}
            </button>
            <p className="mt-2 text-xs leading-5 text-green-900">
              Development only: deleting the event also removes its related test data.
            </p>
          </div>
        </div>
      ) : null}

      {success ? (
        <EventEmailTemplate {...success.emailTemplate} />
      ) : null}

      {deleteMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            {deleteMessage}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
          {details?.length ? (
            <ul className="mt-3 space-y-1 text-sm leading-6 text-red-900">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {success ? (
          <a href="/organizer/dashboard" className="btn-primary">
            Return to Dashboard
          </a>
        ) : (
          <>
            <Link href="/organizer/create-event" className="btn-secondary">
              Back to Edit
            </Link>
            <button
              className="btn-primary disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish Event"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
