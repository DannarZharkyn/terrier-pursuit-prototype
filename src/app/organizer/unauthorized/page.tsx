import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Logo } from "@/components/logo";

export default function OrganizerUnauthorizedPage() {
  return (
    <main className="page-shell flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center"><Logo href="/organizer/login" /></div>
        <div className="card p-8">
          <ShieldX className="mx-auto h-10 w-10 text-bu-red" />
          <h1 className="mt-4 text-2xl font-black text-gray-950">Organizer Access Denied</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            This account is not approved to access the organizer area.
          </p>
          <Link className="btn-primary mt-6 w-full" href="/organizer/login">Return to Sign In</Link>
        </div>
      </section>
    </main>
  );
}
