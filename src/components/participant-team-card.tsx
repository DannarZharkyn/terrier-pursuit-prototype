"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, Trash2, Users, X, XCircle } from "lucide-react";
import type {
  DeleteTeamResponse,
  ParticipantTeam,
  RemoveTeamMemberResponse,
  TeamMember,
} from "@/lib/participant-teams/types";
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
  const [currentParticipantId, setCurrentParticipantId] = useState<string>();
  const [members, setMembers] = useState(team.members);
  const [selectedMember, setSelectedMember] = useState<TeamMember>();
  const [reason, setReason] = useState<"did_not_show_up" | "other">("did_not_show_up");
  const [explanation, setExplanation] = useState("");
  const [attested, setAttested] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setCurrentParticipantId(readParticipantSession()?.participant.id);
  }, []);

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

  function openRemoval(member: TeamMember) {
    setSelectedMember(member);
    setReason("did_not_show_up");
    setExplanation("");
    setAttested(false);
    setError(undefined);
  }

  function closeRemoval() {
    if (!isRemoving) {
      setSelectedMember(undefined);
    }
  }

  async function removeMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readParticipantSession();

    if (!session || !selectedMember) {
      router.replace("/participant/welcome");
      return;
    }

    setIsRemoving(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/participant/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          removerParticipantId: session.participant.id,
          removedParticipantId: selectedMember.id,
          reason,
          explanation,
          attested,
        }),
      });
      const result = (await response.json()) as RemoveTeamMemberResponse;

      if (!result.ok) {
        setError(result.details?.join(" ") || result.error);
        return;
      }

      setMembers((currentMembers) => (
        currentMembers.filter((member) => member.id !== result.removedParticipantId)
      ));
      setSelectedMember(undefined);
      router.refresh();
    } catch {
      setError("Could not remove this team member. Please try again.");
    } finally {
      setIsRemoving(false);
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
        Share this team code with your teammates and confirm that everyone appears in the member list below. This is not the event’s game code.
      </p>
      <div className="mt-5 rounded-lg bg-white p-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-bu-red" />
          <p className="text-sm font-black text-gray-950">
            Current Team Members
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
              <span>
                {member.firstName} {member.lastName}
                <span className="block text-xs font-medium text-gray-500">
                  {member.email}
                </span>
              </span>
              {currentParticipantId && member.id !== currentParticipantId ? (
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-bu-red focus:outline-none focus:ring-2 focus:ring-bu-red"
                  aria-label={`Remove ${member.firstName} ${member.lastName} from the team`}
                  onClick={() => openRemoval(member)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
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
      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
          <form
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onSubmit={removeMember}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-950">Remove Team Member</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Why are you removing {selectedMember.firstName} {selectedMember.lastName}?
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="Close removal form"
                onClick={closeRemoval}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="label">Reason</span>
              <select
                className="field mt-2"
                value={reason}
                onChange={(inputEvent) => setReason(
                  inputEvent.target.value as "did_not_show_up" | "other",
                )}
              >
                <option value="did_not_show_up">Person did not show up</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="mt-4 block">
              <span className="label">Explanation</span>
              <textarea
                className="field mt-2 min-h-28 resize-y"
                placeholder="Briefly explain why this person should be removed."
                value={explanation}
                maxLength={1000}
                onChange={(inputEvent) => setExplanation(inputEvent.target.value)}
                required
              />
            </label>

            <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-gray-700">
              <input
                className="mt-1 h-4 w-4 accent-red-700"
                type="checkbox"
                checked={attested}
                onChange={(inputEvent) => setAttested(inputEvent.target.checked)}
                required
              />
              <span>I confirm that the information I entered is true and accurate.</span>
            </label>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeRemoval}
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                disabled={isRemoving || explanation.trim().length < 3 || !attested}
              >
                <Trash2 className="h-4 w-4" />
                {isRemoving ? "Removing..." : "Remove Member"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
