import { AlertCircle } from "lucide-react";
import { CreateEventPublishActions } from "@/components/create-event-publish-actions";
import { CreateEventReviewSummary } from "@/components/create-event-review-summary";
import { OrganizerShell } from "@/components/organizer-shell";

export default function PublishReviewPage() {
  return (
    <OrganizerShell
      title="Review & Publish"
      subtitle="Confirm the event details before saving the event."
    >
      <section className="card mx-auto max-w-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bu-soft text-bu-red">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-950">
              Ready to publish this event?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Publishing this event saves the event details, participants, and
              locations to Supabase. Emails will be added in a later step.
            </p>
          </div>
        </div>

        <CreateEventReviewSummary />

        <div className="mt-6 rounded-lg bg-gray-100 p-4 text-sm leading-6 text-gray-700">
          This is a prototype confirmation step. No real emails are sent from
          this demo.
        </div>

        <CreateEventPublishActions />
      </section>
    </OrganizerShell>
  );
}
