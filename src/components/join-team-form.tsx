"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, XCircle } from "lucide-react";
import { ParticipantTeamCard } from "@/components/participant-team-card";
import { useParticipantTeamChanges } from "@/hooks/use-participant-team-changes";
import type {
  CurrentTeamResponse,
  JoinTeamResponse,
  ParticipantTeam,
} from "@/lib/participant-teams/types";
import {
  readParticipantSession,
  type ParticipantSession,
} from "@/lib/participant-session";

export function JoinTeamForm() {
  const router = useRouter();
  const [session, setSession] = useState<ParticipantSession>();
  const [teamCode, setTeamCode] = useState("");
  const [team, setTeam] = useState<ParticipantTeam>();
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>();
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

      setTeam(result.team ?? undefined);
    } catch {
      setError("Could not load your team. Please refresh and try again.");
    } finally {
      setIsLoadingTeam(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      router.replace("/participant/welcome");
      return;
    }

    setIsJoining(true);
    setSuccessMessage(undefined);
    setError(undefined);
    setDetails(undefined);

    try {
      const response = await fetch("/api/participant/teams/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: session.event.id,
          participantId: session.participant.id,
          teamCode,
        }),
      });
      const result = (await response.json()) as JoinTeamResponse;

      if (!result.ok) {
        setError(result.error);
        setDetails(result.details);
        return;
      }

      setTeam(result.team);
      setSuccessMessage("Team joined.");
      setTeamCode("");
    } catch {
      setError("Could not reach the join-team API. Please try again.");
    } finally {
      setIsJoining(false);
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
    return (
      <ParticipantTeamCard
        team={team}
        statusText={successMessage ?? "You are on a team."}
      />
    );
  }

  return (
    <div className="space-y-5">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="label">Team Code</span>
          <input
            className="field mt-2 uppercase"
            placeholder="ABC234"
            value={teamCode}
            onChange={(event) => setTeamCode(event.target.value)}
            disabled={isJoining}
          />
        </label>
        <button
          className="btn-primary w-full disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          type="submit"
          disabled={isJoining}
        >
          {isJoining ? "Joining Team..." : "Join Team"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

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
    </div>
  );
}
