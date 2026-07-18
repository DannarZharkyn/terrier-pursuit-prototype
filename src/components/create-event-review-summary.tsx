"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, MapPin, Users } from "lucide-react";
import {
  readCreateEventDraft,
  type CreateEventDraft,
} from "@/lib/imports/create-event-draft";

export function CreateEventReviewSummary() {
  const [draft, setDraft] = useState<CreateEventDraft>();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setDraft(readCreateEventDraft());
    setHasLoaded(true);
  }, []);

  if (!hasLoaded) {
    return (
      <div className="mt-6 rounded-lg bg-gray-100 p-4 text-sm font-semibold text-gray-600">
        Loading uploaded file summary...
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
        Uploaded file details were not found for this browser session. Go back
        and upload both spreadsheets again before publishing.
        <div className="mt-4">
          <Link href="/organizer/create-event" className="btn-secondary py-2">
            Back to Uploads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-bu-red" />
        <div>
          <p className="text-sm font-black text-gray-950">Uploaded File Summary</p>
          <p className="text-xs font-semibold text-gray-500">
            Temporary browser review data
          </p>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4">
          <dt className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Users className="h-4 w-4 text-bu-red" />
            Participants
          </dt>
          <dd className="mt-2 text-3xl font-black text-gray-950">
            {draft.participants.length}
          </dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <dt className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <MapPin className="h-4 w-4 text-bu-red" />
            Locations & Clues
          </dt>
          <dd className="mt-2 text-3xl font-black text-gray-950">
            {draft.locations.length}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-gray-600">
        These counts came from the validated spreadsheets in this browser tab.
        They have not been saved to Supabase yet.
      </p>
    </div>
  );
}
