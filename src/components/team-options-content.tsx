"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, UserPlus, Users, XCircle } from "lucide-react";
import { ParticipantTeamCard } from "@/components/participant-team-card";
import { useParticipantTeamChanges } from "@/hooks/use-participant-team-changes";
import type {
  CurrentTeamResponse,
  ParticipantTeam,
} from "@/lib/participant-teams/types";
import {
  readParticipantSession,
  type ParticipantSession,
} from "@/lib/participant-session";

export function TeamOptionsContent() {
  const router = useRouter();
  const [session, setSession] = useState<ParticipantSession>();
  const [team, setTeam] = useState<ParticipantTeam | null>();
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [error, setError] = useState<string>();
  const [details, setDetails] = useState<string[]>();

  useParticipantTeamChanges(() => {
    const storedSession = readParticipantSession();
    if (storedSession) void loadCurrentTeam(storedSession);
  });

  useEffect(() => {
    const storedSession = readParticipantSession();

    if (!storedSession) {
      router.replace("/participant/welcome");
      return;
    }

    setSession(storedSession);
    void loadCurrentTeam(storedSession);
  }, [router]);

  async function loadCurrentTeam(storedSession: ParticipantSession) {
    setIsLoadingTeam(true);
    setError(undefined);
    setDetails(undefined);

    try {
      const params = new URLSearchParams({
        eventId: storedSession.event.id,
        participantId: storedSession.participant.id,
      });
      const response = await fetch(`/api/participant/teams?${params.toString()}`);
      const result = (await response.json()) as CurrentTeamResponse;

      if (!result.ok) {
        setError(result.error);
        setDetails(result.details);
        return;
      }

      setTeam(result.team);
    } catch {
      setError("Could not load your team. Please refresh and try again.");
    } finally {
      setIsLoadingTeam(false);
    }
  }

  if (!session) {
    return null;
  }

  if (isLoadingTeam) {
    return (
      <div className="card p-5 text-sm font-semibold text-gray-600">
        Loading your team...
      </div>
    );
  }

  if (team) {
    return <ParticipantTeamCard team={team} />;
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="text-sm font-semibold text-gray-500">
          Signed in for {session.event.name}
        </p>
        <h2 className="mt-1 text-xl font-black text-gray-950">
          How would you like to join?
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Whether you were pre-registered or registered spontaneously, you can now create a team or join the correct existing team.
        </p>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
          {details?.length ? (
            <ul className="mt-3 space-y-1 text-sm leading-6 text-red-900">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-gray-950">Starting a new team?</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">Create it, then share its team code and confirm that every teammate joins the correct team.</p>
          <Link href="/participant/create-team" className="btn-primary mt-3 w-full"><UserPlus className="h-4 w-4" />Create Team</Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-bold text-gray-950">Has someone already created your team?</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">Ask a teammate or team leader for the team code shown on their Profile page.</p>
          <Link href="/participant/join-team" className="btn-secondary mt-3 w-full"><Users className="h-4 w-4" />Join Existing Team</Link>
        </div>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>If you do not create or join a team, you may wait. The event organizer can assign you to a team from the unassigned-participant list.</p>
        </div>
      </div>
    </div>
  );
}
