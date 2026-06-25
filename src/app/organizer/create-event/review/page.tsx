import Link from "next/link";
import { AlertCircle, MailCheck } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";

export default function PublishReviewPage() {
  return (
    <OrganizerShell
      title="Review & Publish"
      subtitle="Confirm the event details before participant emails are sent."
    >
      <section className="card mx-auto max-w-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bu-soft text-bu-red">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-950">
              Ready to publish Spring Campus Chase?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Publishing this event will automatically send the registration
              details, rules, start time, and game code to everyone in the
              uploaded participant email list.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <MailCheck className="h-5 w-5 text-bu-red" />
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                Game Code
              </p>
              <p className="mt-1 text-3xl font-black tracking-normal text-bu-red">
                SHA12
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Participants will enter this code when joining the event.
          </p>
        </div>

        <div className="mt-6 rounded-lg bg-gray-100 p-4 text-sm leading-6 text-gray-700">
          This is a prototype confirmation step. No real emails are sent from
          this demo.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href="/organizer/create-event" className="btn-secondary">
            Back to Edit
          </Link>
          <Link href="/organizer/create-event/confirmation" className="btn-primary">
            Publish & Send Emails
          </Link>
        </div>
      </section>
    </OrganizerShell>
  );
}
