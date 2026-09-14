"use client";

import { FormEvent, useState } from "react";
import { BadgeCheck, CheckCircle2, PlusCircle, RotateCcw, Shuffle, Sparkles, Trash2, UserPlus, Users, XCircle } from "lucide-react";

export type UnassignedStudent = {
  id: string;
  name: string;
  email: string;
  role: "leader" | "participant" | null;
  isTeamContact: boolean;
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
  const [assignmentMode, setAssignmentMode] = useState<"random" | "role_balanced">("random");
  const [targetTeamSize, setTargetTeamSize] = useState(5);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [updatingContactId, setUpdatingContactId] = useState<string>();
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const leaderCount = students.filter((student) => student.role === "leader").length;
  const designatedContactCount = students.filter((student) => student.role !== "leader" && student.isTeamContact).length;
  const coordinatorCount = students.filter((student) => student.role === "leader" || student.isTeamContact).length;
  const targetTeamSizeValid = Number.isInteger(targetTeamSize) && targetTeamSize >= 2 && targetTeamSize <= 20;
  const requiredTeamCount = students.length && targetTeamSizeValid ? Math.ceil(students.length / targetTeamSize) : 0;
  const contactShortage = Math.max(0, requiredTeamCount - coordinatorCount);
  const specifiedParticipantCount = students.filter((student) => student.role === "participant").length;
  const unspecifiedRoleCount = students.filter((student) => !student.role).length;
  const assignedParticipantCount = teams.reduce((total, team) => total + team.memberCount, 0);

  async function automaticallyAssign() {
    if (!students.length) return;
    const modeDescription = assignmentMode === "role_balanced"
      ? `create ${requiredTeamCount} balanced teams with one preferred leader or designated team contact on each team`
      : `randomly distribute ${students.length} participants into balanced teams of about ${targetTeamSize}`;

    if (!window.confirm(`Automatically ${modeDescription}? Existing team memberships will not be changed.`)) return;

    setIsAutoAssigning(true);
    setSuccess(undefined);
    setError(undefined);

    try {
      const response = await fetch("/api/organizer/team-assignments/automatic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, mode: assignmentMode, targetTeamSize }),
      });
      const result = await response.json() as {
        ok: boolean;
        error?: string;
        assignedCount?: number;
        teamsCreated?: number;
      };

      if (!result.ok) {
        setError(result.error ?? "Could not assign teams automatically.");
        return;
      }

      setSuccess(`${result.assignedCount} participants were assigned. ${result.teamsCreated} teams were created.`);
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      setError("Could not reach the automatic assignment service. Please try again.");
    } finally {
      setIsAutoAssigning(false);
    }
  }

  async function resetTeamAssignments() {
    if (!assignedParticipantCount) return;
    if (!window.confirm(
      `Unassign all ${assignedParticipantCount} team members and delete every team? The participants and event will be kept. This cannot be undone.`,
    )) return;

    setIsResetting(true);
    setSuccess(undefined);
    setError(undefined);

    try {
      const response = await fetch("/api/organizer/team-assignments/automatic", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const result = await response.json() as { ok: boolean; error?: string; unassignedCount?: number };

      if (!result.ok) {
        setError(result.error ?? "Could not reset the team assignments.");
        return;
      }

      setSuccess(`${result.unassignedCount} participants were returned to the unassigned list. All teams were deleted.`);
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      setError("Could not reach the team reset service. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  async function setTeamContact(student: UnassignedStudent, isTeamContact: boolean) {
    setUpdatingContactId(student.id);
    setSuccess(undefined);
    setError(undefined);

    try {
      const response = await fetch("/api/organizer/team-assignments/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, participantId: student.id, isTeamContact }),
      });
      const result = await response.json() as { ok: boolean; error?: string };

      if (!result.ok) {
        setError(result.error ?? "Could not update the team contact.");
        return;
      }

      setStudents((current) => current.map((item) =>
        item.id === student.id ? { ...item, isTeamContact } : item));
      setTeams((current) => current.map((team) => ({
        ...team,
        members: team.members.map((member) =>
          member.id === student.id ? { ...member, isTeamContact } : member),
      })));
      setSuccess(isTeamContact
        ? `${student.name} is now a team contact.`
        : `${student.name} is no longer a team contact.`);
    } catch {
      setError("Could not reach the team-contact service. Please try again.");
    } finally {
      setUpdatingContactId(undefined);
    }
  }

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
      const result = (await response.json()) as { ok: boolean; error?: string; teamDeleted?: boolean };

      if (!result.ok) {
        setError(result.error ?? "Could not remove the participant from the team.");
        return;
      }

      setTeams((currentTeams) => result.teamDeleted
        ? currentTeams.filter((currentTeam) => currentTeam.id !== team.id)
        : currentTeams.map((currentTeam) =>
            currentTeam.id === team.id
              ? {
                  ...currentTeam,
                  memberCount: Math.max(0, currentTeam.memberCount - 1),
                  members: currentTeam.members.filter((currentMember) => currentMember.id !== member.id),
                }
              : currentTeam,
          ),
      );
      if (result.teamDeleted) {
        setExpandedTeamId(undefined);
      }
      setStudents((currentStudents) => [...currentStudents, member]);
      setSelectedStudentId((currentId) => currentId ?? member.id);
      setSuccess(
        result.teamDeleted
          ? `${member.name} was returned to the unassigned list, and the empty ${team.name} team was deleted.`
          : `${member.name} was removed from ${team.name} and returned to the unassigned list.`,
      );
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

      <section className="card mb-6 overflow-hidden border-bu-red/20">
        <div className="border-b border-gray-200 bg-bu-soft px-5 py-4">
          <div className="flex items-center gap-2 text-bu-red"><Sparkles className="h-5 w-5" /><h2 className="text-lg font-black text-gray-950">Automatic Team Assignment</h2></div>
          <p className="mt-1 text-sm leading-6 text-gray-600">Assign the entire waiting list at once. Existing team memberships stay unchanged.</p>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className={`block rounded-lg border p-4 ${assignmentMode === "random" ? "border-bu-red bg-red-50" : "border-gray-200 bg-white"}`}>
            <span className="flex items-start gap-3">
              <input className="mt-1 accent-red-600" type="radio" name="assignment-mode" checked={assignmentMode === "random"} onChange={() => setAssignmentMode("random")} />
              <span><span className="block font-black text-gray-950">Random and balanced</span><span className="mt-1 block text-sm leading-5 text-gray-600">Shuffle everyone and keep team sizes as even as possible.</span></span>
            </span>
          </label>
          <label className={`block rounded-lg border p-4 ${assignmentMode === "role_balanced" ? "border-bu-red bg-red-50" : "border-gray-200 bg-white"}`}>
            <span className="flex items-start gap-3">
              <input className="mt-1 accent-red-600" type="radio" name="assignment-mode" checked={assignmentMode === "role_balanced"} onChange={() => setAssignmentMode("role_balanced")} />
              <span><span className="block font-black text-gray-950">Balance by role</span><span className="mt-1 block text-sm leading-5 text-gray-600">Create teams at the target size with one preferred leader or organizer-designated contact per team.</span></span>
            </span>
          </label>
          <div className="min-w-44">
            <label className="block"><span className="label">Target team size</span><input className="field mt-2" type="number" min={2} max={20} value={targetTeamSize} onChange={(event) => setTargetTeamSize(Number(event.target.value))} /></label>
            <button className="btn-primary mt-3 w-full" type="button" disabled={!students.length || !targetTeamSizeValid || isAutoAssigning || isResetting || (assignmentMode === "role_balanced" && contactShortage > 0)} onClick={automaticallyAssign}>
              <Shuffle className="h-4 w-4" />{isAutoAssigning ? "Assigning..." : "Assign Everyone"}
            </button>
            <button className="btn-secondary mt-2 w-full border-red-200 text-red-700 hover:bg-red-50" type="button" disabled={!assignedParticipantCount || isAutoAssigning || isResetting} onClick={resetTeamAssignments}>
              <RotateCcw className="h-4 w-4" />{isResetting ? "Resetting..." : "Unassign Everyone"}
            </button>
          </div>
        </div>
        {assignmentMode === "role_balanced" ? (
          <div className={`border-t px-5 py-3 text-sm font-semibold ${contactShortage ? "border-amber-200 bg-amber-50 text-amber-900" : "border-green-200 bg-green-50 text-green-900"}`}>
            {contactShortage
              ? `${requiredTeamCount} teams are needed. Designate ${contactShortage} more team contact${contactShortage === 1 ? "" : "s"} below before assigning.`
              : `${requiredTeamCount} teams are needed, and every team can receive a leader or team contact.`}
          </div>
        ) : null}
        <div className="grid gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 text-sm text-gray-700 sm:grid-cols-5">
          <p><strong>{students.length}</strong> waiting</p><p><strong>{requiredTeamCount}</strong> teams needed</p><p><strong>{leaderCount}</strong> preferred leaders</p><p><strong>{designatedContactCount}</strong> team contacts</p><p><strong>{specifiedParticipantCount + unspecifiedRoleCount}</strong> others</p>
        </div>
      </section>

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
                  <RolePill role={student.role} isTeamContact={student.isTeamContact} />
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
            {selectedStudent ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm text-gray-600">{selectedStudent.email}</p><RolePill role={selectedStudent.role} isTeamContact={selectedStudent.isTeamContact} /></div>
                {selectedStudent.role !== "leader" ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                    disabled={updatingContactId === selectedStudent.id}
                    onClick={() => setTeamContact(selectedStudent, !selectedStudent.isTeamContact)}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    {selectedStudent.isTeamContact ? "Remove Team Contact" : "Designate as Team Contact"}
                  </button>
                ) : null}
              </div>
            ) : null}
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
                            <span className="min-w-0"><span className="block truncate">{member.name}</span><RolePill role={member.role} isTeamContact={member.isTeamContact} compact /></span>
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

function RolePill({ role, isTeamContact, compact = false }: { role: UnassignedStudent["role"]; isTeamContact: boolean; compact?: boolean }) {
  return (
    <span className={`${compact ? "mt-0.5" : "mt-2"} flex flex-wrap gap-1`}>
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${role === "leader" ? "bg-amber-100 text-amber-800" : role === "participant" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
        {role ?? "Unspecified role"}
      </span>
      {isTeamContact && role !== "leader" ? <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800">Team contact</span> : null}
    </span>
  );
}
