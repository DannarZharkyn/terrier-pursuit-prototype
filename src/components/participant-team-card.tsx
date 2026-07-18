"use client";

import { CheckCircle2, Users } from "lucide-react";
import type { ParticipantTeam } from "@/lib/participant-teams/types";

type ParticipantTeamCardProps = {
  team: ParticipantTeam;
  statusText?: string;
};

export function ParticipantTeamCard({
  team,
  statusText = "You are on a team.",
}: ParticipantTeamCardProps) {
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
    </div>
  );
}
