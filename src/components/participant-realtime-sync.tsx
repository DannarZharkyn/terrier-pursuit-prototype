"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  notifyParticipantRulesChanged,
  notifyParticipantTeamChanged,
} from "@/lib/participant-realtime";
import { readParticipantSession } from "@/lib/participant-session";

type RealtimeSignal = {
  event_id?: string;
  participant_id?: string | null;
  kind?: "rules_updated" | "team_membership";
};

export function ParticipantRealtimeSync() {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const session = readParticipantSession();

    if (!session) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`participant-sync-${session.event.id}-${session.participant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participant_realtime_signals",
        },
        (payload) => {
          const signal = payload.new as RealtimeSignal;

          if (signal.event_id !== session.event.id) {
            return;
          }

          setStatus(`received-${signal.kind ?? "unknown"}`);

          if (signal.kind === "rules_updated") {
            notifyParticipantRulesChanged();
            return;
          }

          if (
            signal.kind === "team_membership" &&
            signal.participant_id === session.participant.id
          ) {
            notifyParticipantTeamChanged();
          }
        },
      )
      .subscribe((nextStatus) => {
        setStatus(nextStatus.toLowerCase().replaceAll("_", "-"));
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <span
      className="sr-only"
      data-testid="participant-realtime-status"
      aria-hidden="true"
    >
      {status}
    </span>
  );
}
