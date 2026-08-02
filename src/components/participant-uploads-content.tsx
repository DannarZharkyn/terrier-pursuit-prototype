"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { CheckCircle2, ImagePlus, Save, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ParticipantShell } from "@/components/participant-shell";
import { useParticipantTeamChanges } from "@/hooks/use-participant-team-changes";
import { readParticipantSession } from "@/lib/participant-session";
import type { CurrentTeamResponse, ParticipantTeam } from "@/lib/participant-teams/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SavedPhoto = {
  id: string;
  originalName: string;
  signedUrl: string;
  uploadedAt: string;
  uploadedBy: string;
};

type ClueUpload = {
  id: string;
  position: number;
  clue: string;
  photo: SavedPhoto | null;
};

type SubmissionResponse = {
  ok: boolean;
  submitted?: boolean;
  locations?: ClueUpload[];
  error?: string;
};

export function ParticipantUploadsContent() {
  const router = useRouter();
  const [team, setTeam] = useState<ParticipantTeam | null>();
  const [locations, setLocations] = useState<ClueUpload[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [savingLocationId, setSavingLocationId] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useParticipantTeamChanges(() => void loadFolder());

  useEffect(() => {
    void loadFolder();
  }, []);

  async function loadFolder() {
    const session = readParticipantSession();

    if (!session) {
      router.replace("/participant/welcome");
      return;
    }

    try {
      const teamParams = new URLSearchParams({
        eventId: session.event.id,
        participantId: session.participant.id,
      });
      const teamResponse = await fetch(`/api/participant/teams?${teamParams}`, {
        cache: "no-store",
      });
      const teamResult = (await teamResponse.json()) as CurrentTeamResponse;

      if (!teamResult.ok) {
        throw new Error(teamResult.error);
      }

      setTeam(teamResult.team);

      if (!teamResult.team) {
        return;
      }

      const submissionParams = new URLSearchParams({
        teamId: teamResult.team.id,
        participantId: session.participant.id,
      });
      const response = await fetch(`/api/participant/submissions?${submissionParams}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as SubmissionResponse;

      if (!result.ok) {
        throw new Error(result.error || "Could not load the team folder.");
      }

      setLocations(result.locations ?? []);
      setSubmitted(Boolean(result.submitted));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the team folder.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectFile(locationId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFiles((current) => ({ ...current, [locationId]: file }));
    setMessage(undefined);
    setError(undefined);
  }

  async function savePhoto(locationId: string) {
    const session = readParticipantSession();
    const file = selectedFiles[locationId];

    if (!session || !team) {
      router.replace("/participant/welcome");
      return;
    }

    if (!file) {
      setError("Choose a picture for this clue first.");
      return;
    }

    setSavingLocationId(locationId);
    setError(undefined);
    setMessage(undefined);

    try {
      const preparedResponse = await fetch("/api/participant/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          teamId: team.id,
          participantId: session.participant.id,
          locationId,
          files: [fileDetails(file)],
        }),
      });
      const prepared = (await preparedResponse.json()) as {
        ok: boolean;
        uploads?: { path: string; token: string }[];
        error?: string;
      };
      const upload = prepared.uploads?.[0];

      if (!prepared.ok || !upload) {
        throw new Error(prepared.error || "Could not prepare this upload.");
      }

      const storage = createSupabaseBrowserClient().storage.from("game-submissions");
      const uploaded = await storage.uploadToSignedUrl(upload.path, upload.token, file, {
        contentType: file.type,
      });

      if (uploaded.error) {
        throw new Error(uploaded.error.message);
      }

      const savedResponse = await fetch("/api/participant/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          teamId: team.id,
          participantId: session.participant.id,
          locationId,
          files: [{ ...fileDetails(file), path: upload.path }],
        }),
      });
      const saved = (await savedResponse.json()) as SubmissionResponse;

      if (!saved.ok) {
        throw new Error(saved.error || "Could not save this picture.");
      }

      setSelectedFiles((current) => {
        const next = { ...current };
        delete next[locationId];
        return next;
      });
      setMessage("Picture saved. Every teammate can see it from the team folder.");
      await loadFolder();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this picture.");
    } finally {
      setSavingLocationId(undefined);
    }
  }

  async function finalizeSubmission() {
    const session = readParticipantSession();

    if (!session || !team) {
      router.replace("/participant/welcome");
      return;
    }

    setIsFinalizing(true);
    setError(undefined);

    try {
      const response = await fetch("/api/participant/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          teamId: team.id,
          participantId: session.participant.id,
        }),
      });
      const result = (await response.json()) as SubmissionResponse;

      if (!result.ok) {
        throw new Error(result.error || "Could not submit the team entry.");
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not submit the team entry.",
      );
    } finally {
      setIsFinalizing(false);
    }
  }

  if (isLoading) {
    return (
      <ParticipantShell title="Team Photo Upload">
        <div className="card p-5 text-sm font-semibold text-gray-600">
          Loading your team folder...
        </div>
      </ParticipantShell>
    );
  }

  const savedCount = locations.filter((location) => location.photo).length;
  const allCluesComplete = locations.length > 0 && savedCount === locations.length;

  return (
    <ParticipantShell title="Team Photo Upload">
      <div className="space-y-5">
        <section className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Team folder</p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            {team ? `${team.name} Folder` : "No Team Folder"}
          </h2>
          {team ? (
            <p className="mt-2 text-sm text-gray-600">
              {savedCount} of {locations.length} clue photos saved
            </p>
          ) : null}
        </section>

        {team ? (
          submitted ? (
            <section className="card p-6 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-bu-red" />
              <h2 className="mt-5 text-2xl font-black text-gray-950">
                Your hunt is under review
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Your team&apos;s saved clue photos have been submitted for organizer review.
              </p>
            </section>
          ) : (
            <>
              <div className="rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                Save one picture for each clue. Saved pictures remain here when you leave,
                and any teammate can add or replace a picture before final submission.
              </div>

              <div className="space-y-4">
                {locations.map((location) => {
                  const selectedFile = selectedFiles[location.id];
                  const isSaving = savingLocationId === location.id;

                  return (
                    <section key={location.id} className="card overflow-hidden">
                      <div className="border-b border-gray-200 p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-bu-red">
                          Clue {location.position}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-gray-800">
                          {location.clue}
                        </p>
                      </div>

                      {location.photo ? (
                        <div className="border-b border-gray-200 bg-gray-50 p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={location.photo.signedUrl}
                            alt={`Saved response for clue ${location.position}`}
                            className="max-h-64 w-full rounded-lg object-contain"
                          />
                          <p className="mt-3 text-xs font-semibold text-gray-600">
                            Saved by {location.photo.uploadedBy} ·{" "}
                            {new Date(location.photo.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      ) : null}

                      <div className="p-5">
                        <label className="block">
                          <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900">
                            <ImagePlus className="h-4 w-4 text-bu-red" />
                            {location.photo ? "Replace saved picture" : "Choose picture"}
                          </span>
                          <input
                            className="mt-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:font-bold file:text-gray-800"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                            onChange={(event) => selectFile(location.id, event)}
                          />
                        </label>
                        {selectedFile ? (
                          <p className="mt-3 truncate text-sm font-semibold text-gray-600">
                            Selected: {selectedFile.name}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="btn-secondary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!selectedFile || Boolean(savingLocationId)}
                          onClick={() => savePhoto(location.id)}
                        >
                          <Save className="h-4 w-4" />
                          {isSaving ? "Saving..." : location.photo ? "Save Replacement" : "Save Picture"}
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn-primary w-full disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                disabled={!allCluesComplete || isFinalizing || Boolean(savingLocationId)}
                onClick={finalizeSubmission}
              >
                <Send className="h-4 w-4" />
                {isFinalizing ? "Submitting..." : "Submit Completed Team Entry"}
              </button>
              {!allCluesComplete ? (
                <p className="text-center text-sm font-semibold text-gray-500">
                  Save one picture for every clue to enable final submission.
                </p>
              ) : null}
            </>
          )
        ) : (
          <div className="card p-5 text-sm leading-6 text-gray-600">
            Join or create a team before uploading pictures.
          </div>
        )}

        {message ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </div>
        ) : null}
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
