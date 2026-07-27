"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readParticipantSession } from "@/lib/participant-session";

export function ParticipantConsentGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

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
      .then((response) => response.json())
      .then((result: { ok: boolean; accepted?: boolean }) => {
        if (result.ok && result.accepted) {
          setAllowed(true);
          return;
        }
        router.replace("/participant/disclaimer");
      })
      .catch(() => router.replace("/participant/disclaimer"));
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-600">
          Checking your participant agreement...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
