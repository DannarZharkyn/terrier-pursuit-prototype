import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";

export default function CreateTeamPage() {
  return (
    <ParticipantShell title="Create Team">
      <div className="space-y-5">
        <label className="block">
          <span className="label">Team Name</span>
          <input className="field mt-2" placeholder="Kenmore Crawlers" />
        </label>
        <Link href="/participant/home" className="btn-primary w-full">
          Create Team
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="card p-5 text-center">
          <p className="text-sm font-semibold text-gray-500">Generated Team Code</p>
          <p className="mt-2 text-3xl font-black tracking-normal text-bu-red">
            TEAM-4821
          </p>
        </div>
      </div>
    </ParticipantShell>
  );
}
