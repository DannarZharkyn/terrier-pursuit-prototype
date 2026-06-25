import Link from "next/link";
import { AlertCircle, Send } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";

export default function SubmitHuntConfirmPage() {
  return (
    <ParticipantShell title="Submit Hunt">
      <section className="card p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bu-soft text-bu-red">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-gray-950">
          Are you sure you want to submit?
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Submitting means your team has finished visiting all destination
          places, uploaded the final photos, and ended the game. After this
          step, your hunt will move to organizer review.
        </p>
        <div className="mt-6 rounded-lg bg-gray-100 p-4 text-sm leading-6 text-gray-700">
          This is a prototype confirmation. No files are uploaded and no real
          submission is created.
        </div>
        <div className="mt-7 grid gap-3">
          <Link href="/participant/uploads/submitted" className="btn-primary">
            <Send className="h-4 w-4" />
            Submit Final Hunt
          </Link>
          <Link href="/participant/uploads" className="btn-secondary">
            Back to Folder
          </Link>
        </div>
      </section>
    </ParticipantShell>
  );
}
