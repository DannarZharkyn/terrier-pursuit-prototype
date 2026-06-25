import Link from "next/link";
import { Clock3 } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";

export default function FindTeamPage() {
  return (
    <ParticipantShell title="Find Me a Team">
      <div className="card p-6 text-center">
        <Clock3 className="mx-auto h-12 w-12 text-bu-red" />
        <p className="mt-5 text-lg font-black text-gray-950">
          You have been added to the unassigned participant pool.
        </p>
        <span className="status-pill mt-5 bg-bu-soft text-bu-dark">
          Waiting for Organizer
        </span>
        <Link href="/participant/home" className="btn-secondary mt-8 w-full">
          Preview Home
        </Link>
      </div>
    </ParticipantShell>
  );
}
