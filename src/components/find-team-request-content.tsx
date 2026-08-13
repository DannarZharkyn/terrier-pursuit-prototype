"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { ParticipantTeamCard } from "@/components/participant-team-card";
import type { ParticipantTeamRequestResponse } from "@/lib/participant-team-requests/types";
import type {
  CurrentTeamResponse,
  ParticipantTeam,
} from "@/lib/participant-teams/types";
import {
  readParticipantSession,
  type ParticipantSession,
} from "@/lib/participant-session";
import { formatBostonDateTime } from "@/lib/time/boston";

export function FindTeamRequestContent() {
  const router = useRouter();
  const hasCancelledRef = useRef(false);
  const [session, setSession] = useState<ParticipantSession>();
  const [team, setTeam] = useState<ParticipantTeam>();
  const [requestedAt, setRequestedAt] = useState<string>();
  const [hasCancelled, setHasCancelled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string>();
  const [details, setDetails] = useState<string[]>();

  useEffect(() => {
    const storedSession = readParticipantSession();

    if (!storedSession) {
      router.replace("/participant/welcome");
      return;
    }

    setSession(storedSession);
    void loadOrCreateRequest(storedSession);
  }, [router]);

  async function loadOrCreateRequest(storedSession: ParticipantSession) {
    if (hasCancelledRef.current) {
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setDetails(undefined);

    try {
      const teamResult = await fetchCurrentTeam(storedSession);

      if (!teamResult.ok) {
        setError(teamResult.error);
        setDetails(teamResult.details);
        return;
      }

      if (teamResult.team) {
        if (hasCancelledRef.current) {
          return;
        }
        setTeam(teamResult.team);
        return;
      }

      const existingRequest = await fetchTeamRequest(storedSession);

      if (!existingRequest.ok) {
        setError(existingRequest.error);
        setDetails(existingRequest.details);
        return;
      }

      if (existingRequest.request) {
        if (hasCancelledRef.current) {
          return;
        }
        setRequestedAt(existingRequest.request.requestedAt);
        return;
      }

      if (hasCancelledRef.current) {
        return;
      }

      const createdRequest = await fetch("/api/participant/team-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: storedSession.event.id,
          participantId: storedSession.participant.id,
        }),
      });
      const createdResult =
        (await createdRequest.json()) as ParticipantTeamRequestResponse;

      if (!createdResult.ok) {
        setError(createdResult.error);
        setDetails(createdResult.details);
        return;
      }

      if (hasCancelledRef.current) {
        return;
      }

      setRequestedAt(createdResult.request?.requestedAt);
    } catch {
      setError("Could not save your team request. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelRequest() {
    if (!session) {
      router.replace("/participant/welcome");
      return;
    }

    setIsCancelling(true);
    hasCancelledRef.current = true;
    setHasCancelled(true);
    setError(undefined);
    setDetails(undefined);

    try {
      const response = await fetch("/api/participant/team-request", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: session.event.id,
          participantId: session.participant.id,
        }),
      });
      const result = (await response.json()) as ParticipantTeamRequestResponse;

      if (!result.ok) {
        hasCancelledRef.current = false;
        setHasCancelled(false);
        setError(result.error);
        setDetails(result.details);
        return;
      }

      setRequestedAt(undefined);
      router.replace("/participant/team-options");
    } catch {
      hasCancelledRef.current = false;
      setHasCancelled(false);
      setError("Could not cancel your request. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="card p-5 text-sm font-semibold text-gray-600">
        Saving your team request...
      </div>
    );
  }

  if (team) {
    return <ParticipantTeamCard team={team} />;
  }

  if (hasCancelled) {
    return (
      <div className="card p-5 text-sm font-semibold text-gray-600">
        Returning to team choices...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-6 text-center">
        <Clock3 className="mx-auto h-12 w-12 text-bu-red" />
        <p className="mt-5 text-lg font-black text-gray-950">
          You have been added to the unassigned participant pool.
        </p>
        <span className="status-pill mt-5 bg-bu-soft text-bu-dark">
          Waiting for Organizer
        </span>
        {requestedAt ? (
          <p className="mt-4 text-xs font-semibold text-gray-500">
            Requested {formatRequestedAt(requestedAt)}
          </p>
        ) : null}
        <button
          className="btn-secondary mt-8 w-full disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          type="button"
          onClick={handleCancelRequest}
          disabled={isCancelling}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isCancelling ? "Cancelling..." : "I found a team / I changed my mind"}
        </button>
      </div>

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

async function fetchCurrentTeam(storedSession: ParticipantSession) {
  const params = new URLSearchParams({
    eventId: storedSession.event.id,
    participantId: storedSession.participant.id,
  });
  const response = await fetch(`/api/participant/teams?${params.toString()}`);
  return (await response.json()) as CurrentTeamResponse;
}

async function fetchTeamRequest(storedSession: ParticipantSession) {
  const params = new URLSearchParams({
    eventId: storedSession.event.id,
    participantId: storedSession.participant.id,
  });
  const response = await fetch(
    `/api/participant/team-request?${params.toString()}`,
  );
  return (await response.json()) as ParticipantTeamRequestResponse;
}

function formatRequestedAt(value: string) {
  return formatBostonDateTime(value);
}
