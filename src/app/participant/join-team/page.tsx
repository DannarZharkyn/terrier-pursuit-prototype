import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";

export default function JoinTeamPage() {
  return (
    <ParticipantShell title="Join Team">
      <div className="space-y-5">
        <label className="block">
          <span className="label">Team Code</span>
          <input className="field mt-2" placeholder="TEAM-4821" />
        </label>
        <Link href="/participant/home" className="btn-primary w-full">
          Join Team
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </ParticipantShell>
  );
}
