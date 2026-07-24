"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clipboard, FolderOpen, ImageIcon, X } from "lucide-react";

type ReviewTeam = {
  name: string;
  status: string;
  members: { id: string; name: string; email: string }[];
  photos: { id: string; originalName: string; signedUrl: string }[];
};

export function OrganizerTeamReviewContent({ team }: { team: ReviewTeam }) {
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ReviewTeam["photos"][number]>();
  const emails = team.members.map((member) => member.email).filter(Boolean);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedPhoto(undefined);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedPhoto]);

  async function copyEmails() {
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card p-5">
          <h2 className="text-xl font-black text-gray-950">{team.name}</h2>
          <p className="mt-5 text-sm font-semibold text-gray-500">Members</p>
          <ul className="mt-3 space-y-2">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700"
              >
                {member.name}
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-gray-950">Participant Emails</p>
              <button
                type="button"
                onClick={copyEmails}
                disabled={!emails.length}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-bold text-gray-700 transition hover:border-bu-red hover:text-bu-red disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-3 space-y-1">
              {emails.length ? emails.map((email) => (
                <p key={email} className="break-all text-xs text-gray-600">{email}</p>
              )) : (
                <p className="text-xs text-gray-500">No participant emails found.</p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-sm font-bold text-gray-950">Submitted Pictures</p>
                <p className="text-xs text-gray-500">
                  {team.photos.length} file{team.photos.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-gray-500">
            Status: {team.status}
          </p>
        </aside>

        <div className="card p-5">
          {team.photos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {team.photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.signedUrl}
                    alt={photo.originalName}
                    className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <p className="truncate px-3 py-2 text-xs font-semibold text-gray-600">
                    {photo.originalName}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <ImageIcon className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-600">
                This team has not submitted pictures yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${selectedPhoto.originalName}`}
        >
          <div className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2 sm:px-4">
              <button
                type="button"
                onClick={() => setSelectedPhoto(undefined)}
                className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Review
              </button>
              <p className="min-w-0 truncate text-xs font-semibold text-gray-500 sm:text-sm">
                {selectedPhoto.originalName}
              </p>
              <button
                type="button"
                onClick={() => setSelectedPhoto(undefined)}
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Close photo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-950 p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.signedUrl}
                alt={selectedPhoto.originalName}
                className="max-h-[calc(100vh-7rem)] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
