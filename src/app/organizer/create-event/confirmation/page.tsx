import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";

export default function EventConfirmationPage() {
  return (
    <OrganizerShell
      title="Event Published"
      subtitle="A mock confirmation state for the organizer publishing flow."
    >
      <section className="card mx-auto max-w-2xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-bu-red" />
        <h2 className="mt-5 text-2xl font-black text-gray-950">
          Event Published Successfully
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Event details and participant instructions were sent to the uploaded
          email list.
        </p>
        <Link href="/organizer/dashboard" className="btn-primary mt-8">
          Return to Dashboard
        </Link>
      </section>
    </OrganizerShell>
  );
}
