import Link from "next/link";
import { FileSpreadsheet, Upload } from "lucide-react";
import { OrganizerShell } from "@/components/organizer-shell";

function UploadBlock({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bu-soft text-bu-red">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">Drag file here or browse</p>
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <OrganizerShell
      title="Create Event"
      subtitle="This setup form is visual only, using placeholder uploads and sample event details."
    >
      <div className="card p-5 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="label">Event Name</span>
            <input className="field mt-2" placeholder="Spring Campus Chase" />
          </label>
          <label>
            <span className="label">Registration Deadline</span>
            <input className="field mt-2" type="datetime-local" />
          </label>
          <label>
            <span className="label">Event Start Time</span>
            <input className="field mt-2" type="datetime-local" />
          </label>
          <label>
            <span className="label">Submission Deadline</span>
            <input className="field mt-2" type="datetime-local" />
          </label>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <UploadBlock title="Upload Participant Email List (.csv/.xlsx)" />
          <UploadBlock title="Upload Locations & Clues Spreadsheet" />
        </div>
        <label className="mt-6 block">
          <span className="label flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-bu-red" />
            Rules Text Area
          </span>
          <textarea
            className="field mt-2 min-h-40 resize-none"
            placeholder="Stay with your team, be respectful in public spaces, and submit all photos before the deadline."
          />
        </label>
        <div className="mt-8 flex justify-end">
          <Link href="/organizer/create-event/confirmation" className="btn-primary">
            Publish Event
          </Link>
        </div>
      </div>
    </OrganizerShell>
  );
}
