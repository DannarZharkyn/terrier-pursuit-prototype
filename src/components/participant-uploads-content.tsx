"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ParticipantShell } from "@/components/participant-shell";
import { readParticipantSession } from "@/lib/participant-session";
import type { CurrentTeamResponse, ParticipantTeam } from "@/lib/participant-teams/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ParticipantUploadsContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [team, setTeam] = useState<ParticipantTeam | null>();
  const [submissionChecked, setSubmissionChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>();
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
          setSubmissionChecked(true);
          return;
        }
        setTeam(result.team);

        if (!result.team) {
          setSubmissionChecked(true);
          return;
        }

        const submissionParams = new URLSearchParams({
          teamId: result.team.id,
          participantId: session.participant.id,
        });

        return fetch(`/api/participant/submissions?${submissionParams.toString()}`, {
          cache: "no-store",
        })
          .then(async (response) => (await response.json()) as {
            ok: boolean;
            submitted?: boolean;
            error?: string;
          })
          .then((submission) => {
            if (!submission.ok) {
              setError(submission.error ?? "Could not check submission status.");
              return;
            }

            if (submission.submitted) {
              setSubmitted(true);
              setSubmissionChecked(true);
              return;
            }

            setSubmissionChecked(true);
          });
      })
      .catch(() => {
        setError("Could not load your team folder.");
        setSubmissionChecked(true);
      });
  }, [router]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setError(undefined);
  }

  async function submitPictures() {
    const session = readParticipantSession();

    if (!session || !team) {
      router.replace("/participant/welcome");
      return;
    }

    if (files.length === 0) {
      setError("Select at least one picture before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      setUploadProgress("Preparing secure uploads...");
      const prepareResponse = await fetch("/api/participant/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          teamId: team.id,
          participantId: session.participant.id,
          files: files.map(fileDetails),
        }),
      });
      const prepared = (await prepareResponse.json()) as {
        ok: boolean;
        uploads?: { path: string; token: string }[];
        error?: string;
      };

      if (!prepared.ok || !prepared.uploads) {
        throw new Error(prepared.error || "Could not prepare the uploads.");
      }

      const supabase = createSupabaseBrowserClient();
      const uploadedFiles = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const upload = prepared.uploads[index];
        setUploadProgress(`Uploading picture ${index + 1} of ${files.length}...`);
        const result = await supabase.storage
          .from("game-submissions")
          .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: file.type,
          });

        if (result.error) {
          throw new Error(result.error.message);
        }

        uploadedFiles.push({ ...fileDetails(file), path: upload.path });
      }

      setUploadProgress("Saving team submission...");
      const finalizeResponse = await fetch("/api/participant/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          teamId: team.id,
          participantId: session.participant.id,
          files: uploadedFiles,
        }),
      });
      const finalized = (await finalizeResponse.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!finalized.ok) {
        throw new Error(finalized.error || "Could not finalize the submission.");
      }

      setSubmitted(true);
      setSubmissionChecked(true);
      setFiles([]);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not submit the pictures.",
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(undefined);
    }
  }

  if ((team === undefined || !submissionChecked) && !error) {
    return (
      <ParticipantShell title="Team Photo Upload">
        <div className="card p-5 text-sm font-semibold text-gray-600">
          Loading your team folder...
        </div>
      </ParticipantShell>
    );
  }

  if (submitted) {
    return (
      <ParticipantShell title="Game Complete">
        <section className="card p-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-bu-red" />
          <h2 className="mt-5 text-2xl font-black text-gray-950">
            Your hunt is under review
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Thank you for participating. All selected team pictures were
            submitted together and are ready for organizer review.
          </p>
        </section>
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
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
              All selected pictures will be submitted together. There is no fixed required number.
            </div>

            <button
              type="button"
              className="btn-primary w-full disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
              disabled={isSubmitting || files.length === 0}
              onClick={submitPictures}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? uploadProgress || "Submitting..." : "Submit All Pictures"}
            </button>
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

function fileDetails(file: File) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
  };
}
