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
import type { PlatformTemplates } from "@/lib/templates/defaults";
import { parseBostonDateTime } from "@/lib/time/boston";

export function CreateEventForm({ initialTemplates }: { initialTemplates: PlatformTemplates }) {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [submissionTime, setSubmissionTime] = useState("");
  const [rules, setRules] = useState(initialTemplates.rules);
  const [disclaimer, setDisclaimer] = useState(initialTemplates.disclaimer);
  const [participantResult, setParticipantResult] = useState<ParticipantImportResult>();
  const [locationResult, setLocationResult] = useState<EventLocationImportResult>();
  const startsAt = parseBostonDateTime(startDate, startTime);
  const submissionDeadline = parseBostonDateTime(submissionDate, submissionTime);
  const canReview =
    eventName.trim().length > 0 &&
    Boolean(startsAt) &&
    Boolean(submissionDeadline) &&
    rules.trim().length > 0 &&
    disclaimer.trim().length > 0 &&
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
        disclaimer: disclaimer.trim(),
      },
      participants: participantResult.participants,
      locations: locationResult.locations,
      templates: {
        emailSubject: initialTemplates.emailSubject,
        emailBody: initialTemplates.emailBody,
        participantInstructions: initialTemplates.participantInstructions,
      },
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
          <legend className="label">Event Start Time (Boston time)</legend>
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
          <legend className="label">Submission Deadline (Boston time)</legend>
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
          Participant Rules
        </span>
        <span className="mt-1 block text-sm leading-6 text-gray-600">
          This short template is shown to participants. Adapt any event-specific
          details while keeping the two-section format easy to scan.
        </span>
        <textarea
          className="field mt-2 min-h-[34rem] resize-y"
          value={rules}
          onChange={(event) => setRules(event.target.value)}
        />
      </label>
      <label className="mt-6 block">
        <span className="label">Participant Disclaimer</span>
        <span className="mt-1 block text-sm leading-6 text-gray-600">
          Participants must accept this wording before entering the platform.
          Once one participant accepts, it can no longer be edited.
        </span>
        <textarea
          className="field mt-2 min-h-[32rem] resize-y"
          value={disclaimer}
          onChange={(event) => setDisclaimer(event.target.value)}
        />
        <span className="mt-2 block rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
          Have the sponsoring BU office review this prototype wording and
          determine whether a separate official waiver or media release is required.
        </span>
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
