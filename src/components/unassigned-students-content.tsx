"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, PlusCircle, Trash2, UserPlus, Users, XCircle } from "lucide-react";

export type UnassignedStudent = {
  id: string;
  name: string;
  email: string;
};

export type AvailableTeam = {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  members: UnassignedStudent[];
};

export function UnassignedStudentsContent({
  eventId,
  initialStudents,
  initialTeams,
}: {
  eventId: string;
  initialStudents: UnassignedStudent[];
  initialTeams: AvailableTeam[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [teams, setTeams] = useState(initialTeams);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudents[0]?.id);
  const [assigningTeamId, setAssigningTeamId] = useState<string>();
  const [teamName, setTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string>();
  const [removingParticipantId, setRemovingParticipantId] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [error, setError] = useState<string>();
  const selectedStudent = students.find((student) => student.id === selectedStudentId);

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingTeam(true);
    setSuccess(undefined);
    setError(undefined);

    try {
      const response = await fetch("/api/organizer/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, teamName }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        team?: AvailableTeam;
      };

      if (!result.ok || !result.team) {
        setError(result.error ?? "Could not create the team.");
        return;
      }

      setTeams((currentTeams) => [...currentTeams, result.team as AvailableTeam]);
      setTeamName("");
      setSuccess(`${result.team.name} was created. Its code is ${result.team.code}.`);
    } catch {
      setError("Could not reach the create-team service. Please try again.");
    } finally {
      setIsCreatingTeam(false);
    }
  }

  async function assignToTeam(team: AvailableTeam) {
    if (!selectedStudent) {
      return;
    }

    setAssigningTeamId(team.id);
    setSuccess(undefined);
    setError(undefined);

    try {
      const response = await fetch("/api/organizer/team-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          participantId: selectedStudent.id,
          teamId: team.id,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!result.ok) {
        setError(result.error ?? "Could not assign the participant.");
        return;
      }

      const remainingStudents = students.filter((student) => student.id !== selectedStudent.id);
      setStudents(remainingStudents);
      setSelectedStudentId(remainingStudents[0]?.id);
      setTeams((currentTeams) =>
        currentTeams.map((currentTeam) =>
          currentTeam.id === team.id
            ? {
                ...currentTeam,
                memberCount: currentTeam.memberCount + 1,
                members: [...currentTeam.members, selectedStudent],
              }
            : currentTeam,
        ),
      );
      setSuccess(`${selectedStudent.name} was assigned to ${team.name}.`);
    } catch {
      setError("Could not reach the assignment service. Please try again.");
    } finally {
      setAssigningTeamId(undefined);
    }
  }

  async function removeFromTeam(team: AvailableTeam, member: UnassignedStudent) {
    if (!window.confirm(`Remove ${member.name} from ${team.name}?`)) {
      return;
    }

    setRemovingParticipantId(member.id);
    setSuccess(undefined);
    setError(undefined);

    try {
      const response = await fetch("/api/organizer/team-assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, participantId: member.id, teamId: team.id }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!result.ok) {
        setError(result.error ?? "Could not remove the participant from the team.");
        return;
      }

      setTeams((currentTeams) => currentTeams.map((currentTeam) =>
        currentTeam.id === team.id
          ? {
              ...currentTeam,
              memberCount: Math.max(0, currentTeam.memberCount - 1),
              members: currentTeam.members.filter((currentMember) => currentMember.id !== member.id),
            }
          : currentTeam,
      ));
      setStudents((currentStudents) => [...currentStudents, member]);
      setSelectedStudentId((currentId) => currentId ?? member.id);
      setSuccess(`${member.name} was removed from ${team.name} and returned to the unassigned list.`);
    } catch {
      setError("Could not reach the removal service. Please try again.");
    } finally {
      setRemovingParticipantId(undefined);
    }
  }

  return (
    <>
      {success ? (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{success}</div>
        </div>
      ) : null}
      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          <div className="flex items-center gap-2"><XCircle className="h-4 w-4" />{error}</div>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h2 className="text-lg font-black text-gray-950">Unassigned List</h2>
            <p className="mt-1 text-sm text-gray-600">Select a participant, then choose their team.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {students.length ? students.map((student) => (
              <button
                key={student.id}
                className={`block min-h-16 w-full px-5 py-4 text-left transition ${student.id === selectedStudentId ? "bg-bu-soft" : "bg-white hover:bg-gray-50"}`}
                type="button"
                onClick={() => { setSelectedStudentId(student.id); setSuccess(undefined); setError(undefined); }}
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-950">{student.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{student.email}</p>
                </div>
              </button>
            )) : (
              <div className="px-5 py-4 text-sm text-gray-600">No participants are waiting for organizer placement.</div>
            )}
          </div>
        </div>

        <section className="card overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Selected participant</p>
            <h2 className="mt-1 text-lg font-black text-gray-950">{selectedStudent?.name ?? "No participant selected"}</h2>
            {selectedStudent ? <p className="mt-1 text-sm text-gray-600">{selectedStudent.email}</p> : null}
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <form className="rounded-lg border border-dashed border-bu-red bg-bu-soft p-5" onSubmit={createTeam}>
              <PlusCircle className="h-6 w-6 text-bu-red" />
              <h3 className="mt-3 font-black text-gray-950">Create New Team</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">Give the team a name. A unique code will be generated automatically.</p>
              <label className="mt-4 block">
                <span className="label">Team Name</span>
                <input
                  className="field mt-2 bg-white"
                  placeholder="Kenmore Crawlers"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  disabled={isCreatingTeam}
                  maxLength={80}
                  required
                />
              </label>
              <button
                className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                type="submit"
                disabled={isCreatingTeam || !teamName.trim()}
              >
                {isCreatingTeam ? "Creating..." : "Create Team"}
              </button>
            </form>

            {teams.map((team) => (
              <div key={team.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-gray-950">{team.name}</p>
                    <p className="mt-1 text-sm text-gray-600">{team.memberCount} members</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-500">Team code</p>
                    <p className="mt-1 font-mono text-base font-black tracking-wider text-bu-dark">{team.code}</p>
                  </div>
                  <button
                    className="status-pill shrink-0 bg-gray-100 text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-bu-red"
                    type="button"
                    aria-expanded={expandedTeamId === team.id}
                    aria-label={`${expandedTeamId === team.id ? "Hide" : "Show"} members of ${team.name}`}
                    onClick={() => setExpandedTeamId((currentId) => currentId === team.id ? undefined : team.id)}
                  >
                    <Users className="mr-1 h-3 w-3" />{team.memberCount}
                  </button>
                </div>
                {expandedTeamId === team.id ? (
                  <div className="mt-4 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Members</p>
                    {team.members.length ? (
                      <ul className="mt-1 space-y-0.5 text-xs font-medium text-gray-700">
                        {team.members.map((member) => (
                          <li key={member.id} className="flex min-h-7 items-center justify-between gap-2">
                            <span className="min-w-0 truncate">{member.name}</span>
                            <button
                              className="rounded p-1 text-gray-400 transition hover:bg-red-100 hover:text-bu-red disabled:cursor-not-allowed disabled:opacity-50"
                              type="button"
                              aria-label={`Remove ${member.name} from ${team.name}`}
                              title={`Remove ${member.name}`}
                              disabled={Boolean(removingParticipantId)}
                              onClick={() => removeFromTeam(team, member)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">No members yet.</p>
                    )}
                  </div>
                ) : null}
                <button
                  className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                  type="button"
                  disabled={!selectedStudent || Boolean(assigningTeamId)}
                  onClick={() => assignToTeam(team)}
                >
                  <UserPlus className="h-4 w-4" />
                  {assigningTeamId === team.id ? "Assigning..." : "Assign to This Team"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
