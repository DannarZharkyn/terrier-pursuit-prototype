import { CheckCircle2, Copy, MailCheck } from "lucide-react";
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
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 text-left">
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
            Participants will use this code when joining the event.
          </p>
        </div>
        <div className="mt-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900">
          https://terrier-pursuit.demo/register
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className="btn-secondary" type="button">
            <Copy className="h-4 w-4" />
            Copy Game Code
          </button>
          <button className="btn-secondary" type="button">
            <Copy className="h-4 w-4" />
            Copy Link
          </button>
        </div>
      </section>
    </OrganizerShell>
  );
}
