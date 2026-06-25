import Link from "next/link";
import { PlusCircle, Users } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
import { teams, unassignedStudents } from "@/lib/mock-data";

export default function UnassignedStudentsPage() {
  const selectedStudent = unassignedStudents[0];
  const availableTeams = [
    ...teams.map((team) => ({
      id: team.id,
      name: team.name,
      count: team.members.length,
      members: team.members.join(", "),
    })),
    {
      id: "new-team",
      name: "New Team Draft",
      count: 0,
      members: "Created by organizer",
    },
  ];

  return (
    <OrganizerShell
      title="Unassigned Students"
      subtitle="Review participants who asked the organizer to place them into a team."
    >
      <div className="mb-6">
        <Link
          href="/organizer/event/spring-campus-chase"
          className="text-sm font-bold text-bu-red hover:text-bu-dark"
        >
          Back to Event Dashboard
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h2 className="text-lg font-black text-gray-950">
              Unassigned List
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Select a student to assign them to a team.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {unassignedStudents.map((student, index) => (
              <button
                key={student.id}
                className={`block w-full px-5 py-4 text-left transition ${
                  index === 0 ? "bg-bu-soft" : "bg-white hover:bg-gray-50"
                }`}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-950">{student.name}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {student.email}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    {student.requestedAt}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <p className="text-sm font-semibold text-gray-500">
              Selected Student
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-950">
              {selectedStudent.name}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {selectedStudent.email}
            </p>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
              <h2 className="text-lg font-black text-gray-950">
                Available Teams
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose an existing team or create a new one for organizer
                placement.
              </p>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <button
                className="rounded-lg border border-dashed border-bu-red bg-bu-soft p-5 text-left transition hover:bg-white"
                type="button"
              >
                <PlusCircle className="h-6 w-6 text-bu-red" />
                <p className="mt-3 font-black text-gray-950">
                  Create New Team
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Adds a new empty team to the assignment list.
                </p>
              </button>

              {availableTeams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-950">{team.name}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {team.members}
                      </p>
                    </div>
                    <span className="status-pill bg-gray-100 text-gray-700">
                      <Users className="mr-1 h-3 w-3" />
                      {team.count}
                    </span>
                  </div>
                  <button className="btn-secondary mt-5 w-full py-2" type="button">
                    Assign to This Team
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </OrganizerShell>
  );
}
