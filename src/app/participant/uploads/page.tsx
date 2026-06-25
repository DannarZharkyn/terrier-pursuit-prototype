import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";
import { PhotoGrid } from "@/components/photo-grid";

export default function SharedUploadFolderPage() {
  return (
    <ParticipantShell title="Shared Upload Folder">
      <div className="space-y-5">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Kenmore Crawlers Folder
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                All hunt photos are collected in one shared team folder.
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                After your team has visited every destination, upload all final
                photos here at once and submit the completed hunt.
              </p>
            </div>
            <button
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bu-red text-white shadow-sm"
              type="button"
              aria-label="Upload photo"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </section>
        <PhotoGrid />
        <Link href="/participant/uploads/confirm" className="btn-primary w-full">
          <Send className="h-4 w-4" />
          Submit Hunt
        </Link>
      </div>
    </ParticipantShell>
  );
}
