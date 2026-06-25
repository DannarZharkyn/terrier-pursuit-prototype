import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";

export default function OrganizerLoginPage() {
  return (
    <main className="page-shell flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo href="/organizer/login" />
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-black text-gray-950">
            Organizer Sign In
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Manage events, review team submissions, and keep the hunt moving.
          </p>
          <form className="mt-8 space-y-5">
            <label className="block">
              <span className="label">Email</span>
              <input className="field mt-2" type="email" placeholder="organizer@bu.edu" />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input className="field mt-2" type="password" placeholder="••••••••" />
            </label>
            <Link href="/organizer/dashboard" className="btn-primary w-full">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
