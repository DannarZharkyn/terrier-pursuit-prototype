"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Timer } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";
import {
  readParticipantSession,
  type ParticipantSession,
} from "@/lib/participant-session";
import { clues } from "@/lib/mock-data";

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

  return (
    <ParticipantShell title="Game Home">
      <div className="space-y-6">
        <section className="rounded-lg bg-bu-red p-5 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <Timer className="h-6 w-6" />
            <p className="text-sm font-semibold text-red-50">
              {!hasValidStartTime
                ? "Start time not set"
                : hasStarted
                  ? "Game has started"
                  : "Countdown until game begins"}
            </p>
          </div>
          <p className="mt-4 text-4xl font-black tracking-normal">
            {hasValidStartTime ? formatCountdown(remainingMs) : "--:--:--"}
          </p>
          {hasValidStartTime ? (
            <p className="mt-3 text-sm font-semibold text-red-50">
              Starts {formatUsDateTime(session.event.startsAt)}
            </p>
          ) : null}
        </section>
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
            {clues.map((clue, index) => (
              <div key={clue} className="rounded-lg bg-white p-4 text-sm leading-6 text-gray-700">
                <span className="font-black text-bu-red">Clue {index + 1}: </span>
                {clue}
              </div>
            ))}
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
