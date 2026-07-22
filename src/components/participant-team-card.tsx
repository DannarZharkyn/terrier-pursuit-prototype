"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, Users, XCircle } from "lucide-react";
import type { DeleteTeamResponse, ParticipantTeam } from "@/lib/participant-teams/types";
import { readParticipantSession } from "@/lib/participant-session";

type ParticipantTeamCardProps = {
  team: ParticipantTeam;
  statusText?: string;
};

export function ParticipantTeamCard({
  team,
  statusText = "You are on a team.",
}: ParticipantTeamCardProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string>();

  async function leaveTeam() {
    const session = readParticipantSession();

    if (!session) {
      router.replace("/participant/welcome");
      return;
    }

    if (!window.confirm(`Leave ${team.name}? You will become unassigned.`)) {
      return;
    }

    setIsLeaving(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/participant/teams/${team.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: session.participant.id }),
      });
      const result = (await response.json()) as DeleteTeamResponse;

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace("/participant/team-options");
      router.refresh();
    } catch {
      setError("Could not leave the team. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-green-800">
        <CheckCircle2 className="h-4 w-4" />
        {statusText}
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-500">Team Name</p>
      <p className="mt-1 text-xl font-black text-gray-950">{team.name}</p>
      <p className="mt-5 text-sm font-semibold text-gray-500">Team Code</p>
      <p className="mt-2 text-3xl font-black tracking-normal text-bu-red">
        {team.teamCode}
      </p>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        Share this code with friends so they can join your team later.
      </p>
      <div className="mt-5 rounded-lg bg-white p-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-bu-red" />
          <p className="text-sm font-black text-gray-950">
            Current Team Members
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {team.members.map((member) => (
            <li key={member.id} className="text-sm font-semibold text-gray-700">
              {member.firstName} {member.lastName}
              <span className="block text-xs font-medium text-gray-500">
                {member.email}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}
      <button
        className="btn-secondary mt-5 w-full border-red-200 text-bu-red hover:border-bu-red hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={isLeaving}
        onClick={leaveTeam}
      >
        <LogOut className="h-4 w-4" />
        {isLeaving ? "Leaving Team..." : "Leave This Team"}
      </button>
    </div>
  );
}
