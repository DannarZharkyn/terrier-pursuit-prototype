"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function TemplatesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-5">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-soft">
        <AlertCircle className="h-8 w-8 text-bu-red" />
        <h1 className="mt-4 text-2xl font-black text-gray-950">Templates could not be loaded</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Please confirm that the platform-templates database migration has been applied, then try again.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button className="btn-primary" type="button" onClick={reset}><RefreshCw className="h-4 w-4" />Try Again</button>
          <Link className="btn-secondary" href="/organizer/dashboard"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
