"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearParticipantConsentVerification,
  hasVerifiedParticipantConsent,
  markParticipantConsentVerified,
} from "@/lib/participant-consent-session";
import { readParticipantSession } from "@/lib/participant-session";

export function ParticipantConsentGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [showChecking, setShowChecking] = useState(false);

  useEffect(() => {
    const session = readParticipantSession();

    if (!session) {
      router.replace("/participant/welcome");
      return;
    }

    if (hasVerifiedParticipantConsent(session.event.id, session.participant.id)) {
      setAllowed(true);
      return;
    }

    const checkingTimer = window.setTimeout(() => setShowChecking(true), 350);

    const params = new URLSearchParams({
      eventId: session.event.id,
      participantId: session.participant.id,
    });

    void fetch(`/api/participant/disclaimer?${params}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { ok: boolean; accepted?: boolean }) => {
        if (result.ok && result.accepted) {
          markParticipantConsentVerified(session.event.id, session.participant.id);
          setAllowed(true);
          return;
        }
        clearParticipantConsentVerification(session.event.id, session.participant.id);
        router.replace("/participant/disclaimer");
      })
      .catch(() => router.replace("/participant/disclaimer"))
      .finally(() => window.clearTimeout(checkingTimer));

    return () => window.clearTimeout(checkingTimer);
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-5">
        {showChecking ? (
          <p className="text-sm font-semibold text-gray-600">
            Checking your participant agreement...
          </p>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
