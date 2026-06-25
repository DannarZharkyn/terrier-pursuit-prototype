import { CheckCircle2 } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";

export default function HuntSubmittedPage() {
  return (
    <ParticipantShell title="Game Complete">
      <section className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-bu-red" />
        <h2 className="mt-5 text-2xl font-black text-gray-950">
          Your hunt is under review
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Thank you for participating. Your team has submitted the hunt and the
          game is over.
        </p>
      </section>
    </ParticipantShell>
  );
}
