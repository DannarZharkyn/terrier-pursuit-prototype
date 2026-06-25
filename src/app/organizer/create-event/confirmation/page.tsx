import { CheckCircle2, Copy } from "lucide-react";
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
        <p className="mt-6 text-sm font-semibold text-gray-600">
          Generated Registration Link:
        </p>
        <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900">
          https://terrier-pursuit.demo/register
        </div>
        <button className="btn-secondary mt-5" type="button">
          <Copy className="h-4 w-4" />
          Copy Link
        </button>
      </section>
    </OrganizerShell>
  );
}
