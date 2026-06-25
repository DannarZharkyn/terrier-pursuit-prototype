import { Flag, Timer } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";
import { clues } from "@/lib/mock-data";

export default function ParticipantHomePage() {
  return (
    <ParticipantShell title="Game Home">
      <div className="space-y-6">
        <section className="rounded-lg bg-bu-red p-5 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <Timer className="h-6 w-6" />
            <p className="text-sm font-semibold text-red-50">
              Countdown until game begins
            </p>
          </div>
          <p className="mt-4 text-4xl font-black tracking-normal">01:28:14</p>
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-black text-gray-950">Rules of the Road</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
            <li>Stay together and move safely through public campus spaces.</li>
            <li>Upload every photo to your team&apos;s shared folder.</li>
            <li>Submit the hunt before the deadline to be eligible for review.</li>
          </ul>
        </section>
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <Flag className="h-5 w-5 text-bu-red" />
            <h2 className="text-lg font-black text-gray-950">Destination Clues</h2>
          </div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {clues.map((clue, index) => (
              <div key={clue} className="rounded-lg bg-white p-4 text-sm leading-6 text-gray-700">
                <span className="font-black text-bu-red">Clue {index + 1}: </span>
                {clue}
              </div>
            ))}
          </div>
        </section>
      </div>
    </ParticipantShell>
  );
}
