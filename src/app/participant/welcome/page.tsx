import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { Logo } from "@/components/logo";

export default function ParticipantWelcomePage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-5 py-8 shadow-soft">
        <div className="mb-8">
          <Logo href="/participant/welcome" />
          <h1 className="mt-8 text-3xl font-black text-gray-950">
            Join the Event
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Enter your details to join Spring Campus Chase.
          </p>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="label">Full Name</span>
            <input className="field mt-2" placeholder="Alex Morgan" />
          </label>
          <label className="block">
            <span className="label">BU Email</span>
            <input className="field mt-2" type="email" placeholder="alex@bu.edu" />
          </label>
        </div>
        <div className="mt-7 grid gap-3">
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
      </section>
    </main>
  );
}
