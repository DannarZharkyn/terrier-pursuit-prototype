"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save, XCircle } from "lucide-react";

type EditableEvent = {
  id: string;
  name: string;
  startsAt: string;
  submissionDeadline: string;
  rules: string;
};

export function EditEventForm({ event }: { event: EditableEvent }) {
  const router = useRouter();
  const initialDate = new Date(event.startsAt);
  const initialSubmissionDeadline = new Date(event.submissionDeadline);
  const [name, setName] = useState(event.name);
  const [startDate, setStartDate] = useState(toDateInputValue(initialDate));
  const [startTime, setStartTime] = useState(toTimeInputValue(initialDate));
  const [submissionDate, setSubmissionDate] = useState(toDateInputValue(initialSubmissionDeadline));
  const [submissionTime, setSubmissionTime] = useState(toTimeInputValue(initialSubmissionDeadline));
  const [rules, setRules] = useState(event.rules);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const startsAt = toLocalIsoDateTime(startDate, startTime);
  const submissionDeadline = toLocalIsoDateTime(submissionDate, submissionTime);
  const canSave = Boolean(name.trim() && startsAt && submissionDeadline && rules.trim());

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
        body: JSON.stringify({ name, startsAt, submissionDeadline, rules }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!result.ok) {
        setError(result.error ?? "Could not update the game.");
        return;
      }

      router.push(`/organizer/event/${event.id}`);
      router.refresh();
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

      <fieldset>
        <legend className="label">Game Start Time</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <input
            className="field"
            type="date"
            aria-label="Game start date"
            value={startDate}
            onChange={(inputEvent) => setStartDate(inputEvent.target.value)}
            required
          />
          <input
            className="field"
            type="time"
            step="300"
            aria-label="Game start time"
            value={startTime}
            onChange={(inputEvent) => setStartTime(inputEvent.target.value)}
            required
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Submission Deadline</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <input
            className="field"
            type="date"
            aria-label="Submission deadline date"
            value={submissionDate}
            onChange={(inputEvent) => setSubmissionDate(inputEvent.target.value)}
            required
          />
          <input
            className="field"
            type="time"
            step="300"
            aria-label="Submission deadline time"
            value={submissionTime}
            onChange={(inputEvent) => setSubmissionTime(inputEvent.target.value)}
            required
          />
        </div>
      </fieldset>

      <label className="block">
        <span className="label">Game Rules</span>
        <textarea
          className="field mt-2 min-h-48 resize-y"
          value={rules}
          onChange={(inputEvent) => setRules(inputEvent.target.value)}
          required
        />
      </label>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>You are about to change an existing game. Confirm that the new name, start time, submission deadline, and rules are correct before saving.</p>
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
