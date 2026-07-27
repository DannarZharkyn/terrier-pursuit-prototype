"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { readParticipantSession } from "@/lib/participant-session";

type RulesReviewResponse = {
  ok: boolean;
  updateRequired?: boolean;
  rules?: string;
  rulesVersion?: number;
  updatedAt?: string;
  error?: string;
};

const refreshIntervalMs = 30_000;

export function ParticipantRulesUpdateGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [update, setUpdate] = useState<RulesReviewResponse>();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const checkForUpdate = useCallback(async () => {
    const session = readParticipantSession();

    if (!session) {
      return;
    }

    const params = new URLSearchParams({
      eventId: session.event.id,
      participantId: session.participant.id,
    });

    try {
      const response = await fetch(`/api/participant/rules-review?${params}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as RulesReviewResponse;

      if (result.ok && result.updateRequired) {
        setUpdate(result);
      }
    } catch {
      // A temporary network problem should not hide the participant platform.
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();
    const interval = window.setInterval(() => void checkForUpdate(), refreshIntervalMs);
    return () => window.clearInterval(interval);
  }, [checkForUpdate]);

  async function confirmReview() {
    const session = readParticipantSession();

    if (!session) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const response = await fetch("/api/participant/rules-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: session.event.id,
          participantId: session.participant.id,
          reviewedVersion: update?.rulesVersion,
        }),
      });
      const result = (await response.json()) as RulesReviewResponse;

      if (!result.ok) {
        if (result.updateRequired && result.rules && result.rulesVersion) {
          setUpdate(result);
        }
        setError(result.error ?? "Could not save your rules review.");
        return;
      }

      setUpdate(undefined);
    } catch {
      setError("Could not save your rules review. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {children}
      {update ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/70 p-0 sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="updated-rules-title"
        >
          <section className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-amber-100 p-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                  Action required
                </p>
                <h2 id="updated-rules-title" className="text-xl font-black text-gray-950">
                  The game rules were updated
                </h2>
                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Review the changes before continuing.
                </p>
              </div>
            </div>

            <div className="mt-5 max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800">
              {update.rules}
            </div>

            {error ? (
              <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <button
              className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:bg-gray-300"
              type="button"
              disabled={isSaving}
              onClick={confirmReview}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? "Saving..." : "I Reviewed the Updated Rules"}
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
