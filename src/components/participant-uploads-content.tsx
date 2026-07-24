"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ParticipantShell } from "@/components/participant-shell";
import { readParticipantSession } from "@/lib/participant-session";
import type { CurrentTeamResponse, ParticipantTeam } from "@/lib/participant-teams/types";

export function ParticipantUploadsContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [team, setTeam] = useState<ParticipantTeam | null>();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const session = readParticipantSession();

    if (!session) {
      router.replace("/participant/welcome");
      return;
    }

    const params = new URLSearchParams({
      eventId: session.event.id,
      participantId: session.participant.id,
    });

    void fetch(`/api/participant/teams?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => (await response.json()) as CurrentTeamResponse)
      .then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setTeam(result.team);
      })
      .catch(() => setError("Could not load your team folder."));
  }, [router]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  if (team === undefined && !error) {
    return (
      <ParticipantShell title="Team Photo Upload">
        <div className="card p-5 text-sm font-semibold text-gray-600">
          Loading your team folder...
        </div>
      </ParticipantShell>
    );
  }

  return (
    <ParticipantShell title="Team Photo Upload">
      <div className="space-y-5">
        <section className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Team folder</p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            {team ? `${team.name} Folder` : "No Team Folder"}
          </h2>
        </section>

        {team ? (
          <>
            <section className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-bu-red" />
              <h2 className="mt-3 text-lg font-black text-gray-950">Upload Pictures</h2>
              <p className="mt-1 text-sm text-gray-600">
                Select all of your team&apos;s final pictures together.
              </p>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                multiple
                onChange={selectFiles}
              />
              <button
                className="btn-secondary mt-5"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Select from this device
              </button>
              <p className="mt-4 text-sm font-semibold text-gray-700">
                {files.length
                  ? `${files.length} picture${files.length === 1 ? "" : "s"} selected`
                  : "No pictures selected"}
              </p>
            </section>

            <div className="rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-900">
              All selected pictures will be submitted together. There is no required minimum number.
            </div>

            <Link href="/participant/uploads/confirm" className="btn-primary w-full">
              <Send className="h-4 w-4" />
              Submit All Pictures
            </Link>
          </>
        ) : (
          <div className="card p-5 text-sm leading-6 text-gray-600">
            Join or create a team before uploading pictures.
          </div>
        )}

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
      </div>
    </ParticipantShell>
  );
}
