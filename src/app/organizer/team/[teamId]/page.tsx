import { FolderOpen } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";
import { PhotoGrid } from "@/components/photo-grid";
import { teams } from "@/lib/mock-data";

export default function TeamReviewPage() {
  const team = teams[0];

  return (
    <OrganizerShell
      title="Team Review"
      subtitle="Review a team's shared folder and mark an outcome with visual-only controls."
    >
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card p-5">
          <h2 className="text-xl font-black text-gray-950">{team.name}</h2>
          <p className="mt-5 text-sm font-semibold text-gray-500">Members</p>
          <ul className="mt-3 space-y-2">
            {team.members.map((member) => (
              <li key={member} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                {member}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-sm font-bold text-gray-950">Shared Photo Folder</p>
                <p className="text-xs text-gray-500">6 files submitted</p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <button className="btn-primary" type="button">Approve</button>
            <button className="btn-secondary" type="button">Reject</button>
            <button className="btn-secondary border-bu-red text-bu-red" type="button">
              Mark Winner
            </button>
          </div>
        </aside>
        <div className="card p-5">
          <PhotoGrid />
        </div>
      </section>
    </OrganizerShell>
  );
}
