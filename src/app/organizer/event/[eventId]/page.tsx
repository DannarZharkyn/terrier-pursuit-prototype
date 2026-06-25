import Link from "next/link";
import { ArrowRight, Clock, ClipboardCheck, UserMinus, Users } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
import { teams } from "@/lib/mock-data";

const summary = [
  { label: "Registered Students", value: "142", icon: Users },
  { label: "Teams", value: "32", icon: ClipboardCheck },
  { label: "Unassigned Students", value: "8", icon: UserMinus },
  { label: "Submitted Teams", value: "21", icon: Clock },
];

export default function EventDashboardPage() {
  return (
    <OrganizerShell
      title="Spring Campus Chase"
      subtitle="Monitor registration, team formation, and submission review progress."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card p-5">
              <Icon className="h-6 w-6 text-bu-red" />
              <p className="mt-4 text-3xl font-black text-gray-950">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-600">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
      <section className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-black text-gray-950">Teams</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Team Name</th>
                <th className="px-5 py-3">Members</th>
                <th className="px-5 py-3">Submission Status</th>
                <th className="px-5 py-3">Submission Time</th>
                <th className="px-5 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.map((team) => (
                <tr key={team.id} className="bg-white">
                  <td className="px-5 py-4 font-bold text-gray-950">{team.name}</td>
                  <td className="px-5 py-4 text-gray-600">{team.members.join(", ")}</td>
                  <td className="px-5 py-4">
                    <span className="status-pill bg-bu-soft text-bu-dark">
                      {team.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{team.time}</td>
                  <td className="px-5 py-4">
                    <Link href={`/organizer/team/${team.id}`} className="btn-secondary py-2">
                      Review
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OrganizerShell>
  );
}
