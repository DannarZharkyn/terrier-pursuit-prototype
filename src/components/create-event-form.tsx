"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { EventLocationsUpload } from "@/components/event-locations-upload";
import { ParticipantListUpload } from "@/components/participant-list-upload";
import { TimePicker12 } from "@/components/time-picker-12";
import { saveCreateEventDraft } from "@/lib/imports/create-event-draft";
import type { EventLocationImportResult } from "@/lib/imports/event-locations";
import type { ParticipantImportResult } from "@/lib/imports/participants";

export function CreateEventForm() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [submissionTime, setSubmissionTime] = useState("");
  const [rules, setRules] = useState("");
  const [participantResult, setParticipantResult] = useState<ParticipantImportResult>();
  const [locationResult, setLocationResult] = useState<EventLocationImportResult>();
  const startsAt = toLocalIsoDateTime(startDate, startTime);
  const submissionDeadline = toLocalIsoDateTime(submissionDate, submissionTime);
  const canReview =
    eventName.trim().length > 0 &&
    Boolean(startsAt) &&
    Boolean(submissionDeadline) &&
    rules.trim().length > 0 &&
    participantResult?.ok === true &&
    locationResult?.ok === true;

  function handleReview() {
    if (!canReview) {
      return;
    }

    saveCreateEventDraft({
      event: {
        name: eventName.trim(),
        startsAt,
        submissionDeadline,
        rules: rules.trim(),
      },
      participants: participantResult.participants,
      locations: locationResult.locations,
      savedAt: new Date().toISOString(),
    });
    router.push("/organizer/create-event/review");
  }

  return (
    <div className="card p-5 sm:p-7">
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="label">Event Name</span>
          <input
            className="field mt-2"
            placeholder="Spring Campus Chase"
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
          />
        </label>
        <fieldset>
          <legend className="label">Event Start Time</legend>
          <div className="mt-2 grid gap-3 xl:grid-cols-[minmax(150px,0.8fr)_minmax(230px,1.2fr)]">
            <input
              className="field"
              type="date"
              aria-label="Event start date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <TimePicker12
              label="Event start time"
              value={startTime}
              onChange={setStartTime}
            />
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Submission Deadline</legend>
          <div className="mt-2 grid gap-3 xl:grid-cols-[minmax(150px,0.8fr)_minmax(230px,1.2fr)]">
            <input
              className="field"
              type="date"
              aria-label="Submission deadline date"
              value={submissionDate}
              onChange={(event) => setSubmissionDate(event.target.value)}
            />
            <TimePicker12
              label="Submission deadline time"
              value={submissionTime}
              onChange={setSubmissionTime}
            />
          </div>
        </fieldset>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ParticipantListUpload onResultChange={setParticipantResult} />
        <EventLocationsUpload onResultChange={setLocationResult} />
      </div>
      <label className="mt-6 block">
        <span className="label flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-bu-red" />
          Rules Text Area
        </span>
        <textarea
          className="field mt-2 min-h-40 resize-none"
          placeholder="Stay with your team, be respectful in public spaces, and submit all photos before the deadline."
          value={rules}
          onChange={(event) => setRules(event.target.value)}
        />
      </label>
      <div className="mt-8 flex flex-col items-stretch gap-3 sm:items-end">
        {canReview ? (
          <button className="btn-primary w-full sm:w-auto" type="button" onClick={handleReview}>
            Review & Publish
          </button>
        ) : (
          <>
            <button
              className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 sm:w-auto"
              type="button"
              disabled
            >
              Review & Publish
            </button>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-gray-500 sm:text-right">
              Complete all event fields with the date and time pickers, then upload valid participant and locations files to continue.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function toLocalIsoDateTime(dateText: string, timeText: string) {
  const dateMatch = dateText.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeText.trim().match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return "";
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute > 59 ||
    minute % 5 !== 0
  ) {
    return "";
  }

  const date = new Date(year, month - 1, day, hour, minute);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return "";
  }

  return date.toISOString();
}
