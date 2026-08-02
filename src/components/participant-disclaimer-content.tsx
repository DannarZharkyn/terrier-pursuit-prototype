"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { markParticipantConsentVerified } from "@/lib/participant-consent-session";
import { readParticipantSession } from "@/lib/participant-session";

type DisclaimerResponse = {
  ok: boolean;
  accepted?: boolean;
  disclaimer?: string;
  eventName?: string;
  error?: string;
};

export function ParticipantDisclaimerContent() {
  const router = useRouter();
  const [disclaimer, setDisclaimer] = useState("");
  const [eventName, setEventName] = useState("");
  const [safetyAccepted, setSafetyAccepted] = useState(false);
  const [mediaAccepted, setMediaAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const session = readParticipantSession();

    if (!session) {
      router.replace("/participant/welcome");
      return;
    }

    const params = new URLSearchParams({
      eventId: session.event.id,
      participantId: session.participant.id,
    });

    void fetch(`/api/participant/disclaimer?${params}`, { cache: "no-store" })
      .then(async (response) => (await response.json()) as DisclaimerResponse)
      .then((result) => {
        if (!result.ok) {
          setError(result.error ?? "Could not load the participant disclaimer.");
          return;
        }
        if (result.accepted) {
          markParticipantConsentVerified(session.event.id, session.participant.id);
          router.replace("/participant/team-options");
          return;
        }
        setDisclaimer(result.disclaimer ?? "");
        setEventName(result.eventName ?? session.event.name);
      })
      .catch(() => setError("Could not load the participant disclaimer."))
      .finally(() => setIsLoading(false));
  }, [router]);

  async function acceptDisclaimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readParticipantSession();

    if (!session || !safetyAccepted || !mediaAccepted) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const response = await fetch("/api/participant/disclaimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: session.event.id,
          participantId: session.participant.id,
          activitySafetyAccepted: safetyAccepted,
          mediaDataAccepted: mediaAccepted,
        }),
      });
      const result = (await response.json()) as DisclaimerResponse;

      if (!result.ok) {
        setError(result.error ?? "Could not save your agreement.");
        return;
      }

      markParticipantConsentVerified(session.event.id, session.participant.id);
      router.replace("/participant/team-options");
    } catch {
      setError("Could not save your agreement. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="mx-auto min-h-screen max-w-md bg-white px-5 py-8 shadow-soft">
        <Logo href="/participant/disclaimer" />
        <div className="mt-8 flex items-center gap-3">
          <ShieldCheck className="h-9 w-9 text-bu-red" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-bu-red">
              Required before continuing
            </p>
            <h1 className="text-2xl font-black text-gray-950">
              Participant Agreement
            </h1>
          </div>
        </div>
        {eventName ? (
          <p className="mt-3 text-sm font-bold text-gray-700">{eventName}</p>
        ) : null}

        {isLoading ? (
          <p className="mt-8 text-sm font-semibold text-gray-600">
            Loading agreement...
          </p>
        ) : (
          <form className="mt-6" onSubmit={acceptDisclaimer}>
            <div className="max-h-[45vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800">
              {disclaimer}
            </div>

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
                <input
                  className="mt-1 h-4 w-4 shrink-0 accent-red-600"
                  type="checkbox"
                  checked={safetyAccepted}
                  onChange={(input) => setSafetyAccepted(input.target.checked)}
                />
                <span className="text-sm font-semibold leading-6 text-gray-800">
                  I have read the activity and safety acknowledgment, understand
                  the ordinary risks described above, and agree to follow its
                  safety and conduct requirements.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
                <input
                  className="mt-1 h-4 w-4 shrink-0 accent-red-600"
                  type="checkbox"
                  checked={mediaAccepted}
                  onChange={(input) => setMediaAccepted(input.target.checked)}
                />
                <span className="text-sm font-semibold leading-6 text-gray-800">
                  I consent to the described collection and review of event data
                  and to the described use of submitted photographs that include
                  my likeness or name.
                </span>
              </label>
            </div>

            {error ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <button
              className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
              type="submit"
              disabled={!safetyAccepted || !mediaAccepted || isSaving || !disclaimer}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? "Saving Agreement..." : "Accept & Continue"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
