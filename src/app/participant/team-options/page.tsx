import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";

export default function TeamOptionsPage() {
  return (
    <ParticipantShell title="Choose Team Option">
      <div className="space-y-5">
        <section className="card p-5">
          <p className="text-sm font-semibold text-gray-500">
            Signed in for Spring Campus Chase
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            How would you like to join?
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Create a new team, join friends with a team code, or let the
            organizer place you with other participants.
          </p>
        </section>
        <div className="grid gap-3">
          <Link href="/participant/create-team" className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Create Team
          </Link>
          <Link href="/participant/join-team" className="btn-secondary">
            <Users className="h-4 w-4" />
            Join Existing Team
          </Link>
          <Link href="/participant/find-team" className="btn-secondary">
            <Search className="h-4 w-4" />
            Find Me a Team
          </Link>
        </div>
      </div>
    </ParticipantShell>
  );
}
