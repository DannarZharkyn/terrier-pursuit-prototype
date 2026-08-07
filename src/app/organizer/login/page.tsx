import { Logo } from "@/components/logo";
import { OrganizerLoginForm } from "@/components/organizer-login-form";

export default function OrganizerLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
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
          <OrganizerLoginForm nextPath={searchParams.next} />
        </div>
      </section>
    </main>
  );
}
