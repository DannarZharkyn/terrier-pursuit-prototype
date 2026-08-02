"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Save, XCircle } from "lucide-react";
import { TimePicker12 } from "@/components/time-picker-12";

type EditableEvent = {
  id: string;
  name: string;
  startsAt: string;
  submissionDeadline: string;
  rules: string;
  disclaimer: string;
  disclaimerLocked: boolean;
  emailSubject: string;
  emailBody: string;
};

export function EditEventForm({ event }: { event: EditableEvent }) {
  const initialDate = new Date(event.startsAt);
  const initialSubmissionDeadline = new Date(event.submissionDeadline);
  const [name, setName] = useState(event.name);
  const [startDate, setStartDate] = useState(toDateInputValue(initialDate));
  const [startTime, setStartTime] = useState(toTimeInputValue(initialDate));
  const [submissionDate, setSubmissionDate] = useState(toDateInputValue(initialSubmissionDeadline));
  const [submissionTime, setSubmissionTime] = useState(toTimeInputValue(initialSubmissionDeadline));
  const [rules, setRules] = useState(event.rules);
  const [disclaimer, setDisclaimer] = useState(event.disclaimer);
  const [emailSubject, setEmailSubject] = useState(event.emailSubject);
  const [emailBody, setEmailBody] = useState(event.emailBody);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const startsAt = toLocalIsoDateTime(startDate, startTime);
  const submissionDeadline = toLocalIsoDateTime(submissionDate, submissionTime);
  const canSave = Boolean(
    name.trim()
    && startsAt
    && submissionDeadline
    && rules.trim()
    && disclaimer.trim()
    && emailSubject.trim()
    && emailBody.trim(),
  );

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    if (!canSave) {
      return;
    }

    if (!window.confirm("Confirm changes to this live game? Participants may see the updated name, start time, submission deadline, and rules.")) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/organizer/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startsAt,
          submissionDeadline,
          rules,
          disclaimer,
          emailSubject,
          emailBody,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!result.ok) {
        setError(result.error ?? "Could not update the game.");
        return;
      }

      window.location.assign(`/organizer/event/${event.id}`);
    } catch {
      setError("Could not reach the update service. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="card space-y-6 p-5 sm:p-7" onSubmit={handleSubmit}>
      <label className="block">
        <span className="label">Game Name</span>
        <input
          className="field mt-2"
          value={name}
          onChange={(inputEvent) => setName(inputEvent.target.value)}
          maxLength={120}
          required
        />
      </label>

      <label className="block">
        <span className="label">Participant Disclaimer</span>
        <span className="mt-1 block text-sm leading-6 text-gray-600">
          {event.disclaimerLocked
            ? "Locked because at least one participant accepted this exact wording."
            : "Participants must accept this wording before entering the platform."}
        </span>
        <textarea
          className="field mt-2 min-h-[32rem] resize-y disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600"
          value={disclaimer}
          onChange={(inputEvent) => setDisclaimer(inputEvent.target.value)}
          disabled={event.disclaimerLocked}
          required
        />
        {event.disclaimerLocked ? (
          <span className="mt-2 block rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-semibold leading-5 text-gray-700">
            To use different wording, create a new event so every participant
            accepts the same disclaimer.
          </span>
        ) : null}
      </label>

      <fieldset>
        <legend className="label">Game Start Time</legend>
        <div className="mt-2 grid gap-3 md:grid-cols-[minmax(170px,0.8fr)_minmax(230px,1.2fr)]">
          <input
            className="field"
            type="date"
            aria-label="Game start date"
            value={startDate}
            onChange={(inputEvent) => setStartDate(inputEvent.target.value)}
            required
          />
          <TimePicker12
            label="Game start time"
            value={startTime}
            onChange={setStartTime}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Submission Deadline</legend>
        <div className="mt-2 grid gap-3 md:grid-cols-[minmax(170px,0.8fr)_minmax(230px,1.2fr)]">
          <input
            className="field"
            type="date"
            aria-label="Submission deadline date"
            value={submissionDate}
            onChange={(inputEvent) => setSubmissionDate(inputEvent.target.value)}
            required
          />
          <TimePicker12
            label="Submission deadline time"
            value={submissionTime}
            onChange={setSubmissionTime}
          />
        </div>
      </fieldset>

      <label className="block">
        <span className="label">Game Rules</span>
        <span className="mt-1 block text-sm leading-6 text-gray-600">
          Saving changed rules creates a new version. Participants who previously
          viewed the game must review the update before continuing.
        </span>
        <textarea
          className="field mt-2 min-h-[34rem] resize-y"
          value={rules}
          onChange={(inputEvent) => setRules(inputEvent.target.value)}
          required
        />
      </label>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-black text-gray-950">Participant Invitation Email</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          These saved fields appear on the View Event page for copying into Gmail.
        </p>
        <label className="mt-4 block">
          <span className="label">Email Subject</span>
          <input
            className="field mt-2"
            value={emailSubject}
            onChange={(inputEvent) => setEmailSubject(inputEvent.target.value)}
            maxLength={200}
            required
          />
        </label>
        <label className="mt-4 block">
          <span className="label">Email Message</span>
          <textarea
            className="field mt-2 min-h-72 resize-y"
            value={emailBody}
            onChange={(inputEvent) => setEmailBody(inputEvent.target.value)}
            required
          />
        </label>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>You are about to change an existing game and its saved invitation email. Confirm that all details are correct before saving.</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={`/organizer/event/${event.id}`} className="btn-secondary">
          Cancel
        </Link>
        <button
          className="btn-primary disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          type="submit"
          disabled={!canSave || isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving Changes..." : "Confirm Changes"}
        </button>
      </div>
    </form>
  );
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, "0");
  return `${hour}:${minute}`;
}

function toLocalIsoDateTime(dateText: string, timeText: string) {
  const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeText.match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return "";
  }

  const date = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );

  return Number.isNaN(date.getTime()) || Number(timeMatch[2]) % 5 !== 0
    ? ""
    : date.toISOString();
}
