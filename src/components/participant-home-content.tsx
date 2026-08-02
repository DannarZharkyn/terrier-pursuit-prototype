"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Timer } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";
import {
  readParticipantSession,
  refreshParticipantSession,
  type ParticipantSession,
} from "@/lib/participant-session";
import { participantRulesChangedEvent } from "@/lib/participant-realtime";

const second = 1000;

export function ParticipantHomeContent() {
  const router = useRouter();
  const [session, setSession] = useState<ParticipantSession>();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const storedSession = readParticipantSession();

    if (!storedSession) {
      router.replace("/participant/welcome");
      return;
    }

    setSession(storedSession);
    void refreshEventDetails(storedSession);

    const handleEventDetailsChanged = () => {
      const refreshedSession = readParticipantSession();
      if (refreshedSession) setSession(refreshedSession);
    };
    window.addEventListener(participantRulesChangedEvent, handleEventDetailsChanged);

    async function refreshEventDetails(currentSession: ParticipantSession) {
      try {
        const refreshedSession = await refreshParticipantSession(currentSession);
        if (refreshedSession) setSession(refreshedSession);
      } catch {
        // Keep the last known session available if a refresh temporarily fails.
      }
    }

    return () => {
      window.removeEventListener(participantRulesChangedEvent, handleEventDetailsChanged);
    };
  }, [router]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), second);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!session) {
    return null;
  }

  const startsAtTime = new Date(session.event.startsAt).getTime();
  const hasValidStartTime = !Number.isNaN(startsAtTime);
  const remainingMs = hasValidStartTime ? Math.max(0, startsAtTime - now) : 0;
  const hasStarted = hasValidStartTime && remainingMs === 0;
  const submissionDeadlineTime = new Date(session.event.submissionDeadline).getTime();
  const hasValidSubmissionDeadline = !Number.isNaN(submissionDeadlineTime);
  const submissionRemainingMs = hasValidSubmissionDeadline
    ? Math.max(0, submissionDeadlineTime - now)
    : 0;
  const submissionClosed = hasValidSubmissionDeadline && submissionRemainingMs === 0;
  const gameEnded = hasStarted && submissionClosed;
  const eventClues = session.event.clues ?? [];

  return (
    <ParticipantShell title="Game Home">
      <div className="space-y-6">
        <section className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Current Game</p>
          <h2 className="mt-1 text-xl font-black text-gray-950">{session.event.name}</h2>
        </section>
        <div className={`grid gap-3 ${hasStarted ? "grid-cols-1 min-[430px]:grid-cols-2" : "grid-cols-1"}`}>
          <section className="rounded-lg bg-bu-red p-4 text-white shadow-soft">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 shrink-0" />
              <p className="text-xs font-semibold text-red-50 sm:text-sm">
                {!hasValidStartTime
                  ? "Start time not set"
                  : gameEnded
                    ? "Game status"
                    : hasStarted
                    ? "Game status"
                    : "Until game starts"}
              </p>
            </div>
            <p className="mt-3 text-2xl font-black tabular-nums tracking-normal sm:text-3xl">
              {!hasValidStartTime
                ? "--:--:--"
                : gameEnded
                  ? "Game ended"
                  : hasStarted
                    ? "Game started"
                  : formatCountdown(remainingMs)}
            </p>
            {hasValidStartTime ? (
              <p className="mt-2 text-xs font-semibold text-red-50">
                Starts {formatUsDateTime(session.event.startsAt)}
              </p>
            ) : null}
          </section>
          {hasStarted ? (
            <section className="rounded-lg bg-bu-dark p-4 text-white shadow-soft">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 shrink-0" />
                <p className="text-xs font-semibold text-red-50 sm:text-sm">
                  {!hasValidSubmissionDeadline
                    ? "Deadline not set"
                    : submissionClosed
                      ? "Deadline reached"
                      : "Until submission"}
                </p>
              </div>
              <p className="mt-3 text-2xl font-black tabular-nums tracking-normal sm:text-3xl">
                {!hasValidSubmissionDeadline
                  ? "--:--:--"
                  : submissionClosed
                    ? "Time ended"
                    : formatCountdown(submissionRemainingMs)}
              </p>
              {hasValidSubmissionDeadline ? (
                <p className="mt-2 text-xs font-semibold text-red-50">
                  Submit by {formatUsDateTime(session.event.submissionDeadline)}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
        <section className="card p-5">
          <h2 className="text-lg font-black text-gray-950">Rules of the Road</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">
            {session.event.rules || "Rules will be shared by the organizer."}
          </p>
          {isValidDateTime(session.event.submissionDeadline) ? (
            <p className="mt-4 text-xs font-semibold text-gray-500">
              Submission deadline: {formatUsDateTime(session.event.submissionDeadline)}
            </p>
          ) : null}
        </section>
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <Flag className="h-5 w-5 text-bu-red" />
            <h2 className="text-lg font-black text-gray-950">Destination Clues</h2>
          </div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {gameEnded ? (
              <p className="rounded-lg bg-white p-4 text-sm font-semibold leading-6 text-gray-600">
                Time is up and the game has ended. Thank you for participating!
              </p>
            ) : !hasStarted ? (
              <p className="rounded-lg bg-white p-4 text-sm font-semibold text-gray-600">
                Destination clues will become visible once the game starts.
              </p>
            ) : eventClues.length ? eventClues.map((clue, index) => (
              <div key={`${index}-${clue}`} className="rounded-lg bg-white p-4 text-sm leading-6 text-gray-700">
                <span className="font-black text-bu-red">Clue {index + 1}: </span>
                {clue}
              </div>
            )) : (
              <p className="rounded-lg bg-white p-4 text-sm text-gray-600">
                No destination clues have been added for this game.
              </p>
            )}
          </div>
        </section>
      </div>
    </ParticipantShell>
  );
}

function isValidDateTime(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / second);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");

  return days > 0 ? `${days}d ${clock}` : clock;
}

function formatUsDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
