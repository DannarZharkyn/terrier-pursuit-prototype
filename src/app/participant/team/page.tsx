import { ParticipantShell } from "@/components/participant-shell";

const members = ["Maya Patel", "Jordan Ellis", "Nina Chen", "Theo Brooks"];

export default function MyTeamPage() {
  return (
    <ParticipantShell title="My Team">
      <div className="space-y-5">
        <section className="card p-5">
          <p className="text-sm font-semibold text-gray-500">Team Name</p>
          <h2 className="mt-1 text-2xl font-black text-gray-950">
            Kenmore Crawlers
          </h2>
          <p className="mt-4 text-sm font-semibold text-gray-500">Team Code</p>
          <p className="mt-1 text-2xl font-black tracking-normal text-bu-red">
            TEAM-4821
          </p>
        </section>
        <section className="card p-5">
          <h3 className="text-lg font-black text-gray-950">Team Members</h3>
          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <div key={member} className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-700">
                {member}
              </div>
            ))}
          </div>
        </section>
      </div>
    </ParticipantShell>
  );
}
