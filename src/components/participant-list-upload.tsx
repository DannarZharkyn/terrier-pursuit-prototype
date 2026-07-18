"use client";

import { ChangeEvent, useRef, useState } from "react";
import { CheckCircle2, Upload, XCircle } from "lucide-react";
import {
  parseParticipantImportFile,
  type ParticipantImportResult,
} from "@/lib/imports/participants";

export function ParticipantListUpload({
  onResultChange,
}: {
  onResultChange?: (result: ParticipantImportResult | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>();
  const [result, setResult] = useState<ParticipantImportResult>();
  const [readError, setReadError] = useState<string>();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setResult(undefined);
    setReadError(undefined);
    setFileName(file?.name);
    onResultChange?.(undefined);

    if (!file) {
      return;
    }

    try {
      const fileData = await file.arrayBuffer();
      const nextResult = parseParticipantImportFile(fileData);
      setResult(nextResult);
      onResultChange?.(nextResult);
    } catch {
      setReadError("We could not read this file. Please try another .xlsx or .csv file.");
    }
  }

  return (
    <div>
      <button
        className="w-full rounded-lg border border-dashed border-gray-300 bg-white p-5 text-left transition hover:border-bu-red hover:bg-bu-soft"
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bu-soft text-bu-red">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              Upload Participant Email List (.csv/.xlsx)
            </p>
            <p className="text-sm text-gray-500">
              {fileName ? fileName : "Click to browse for First Name, Last Name, Email"}
            </p>
          </div>
        </div>
      </button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFileChange}
      />

      {readError ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {readError}
        </div>
      ) : null}

      {result?.ok ? (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Participant list looks good.
          </div>
          <dl className="mt-3 grid gap-2 text-sm text-green-900 sm:grid-cols-3">
            <div>
              <dt className="font-semibold">Participants found</dt>
              <dd>{result.summary.importedRows}</dd>
            </div>
            <div>
              <dt className="font-semibold">Blank rows ignored</dt>
              <dd>{result.summary.blankRows}</dd>
            </div>
            <div>
              <dt className="font-semibold">Validation errors</dt>
              <dd>0</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {result && !result.ok ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <XCircle className="h-4 w-4" />
            Fix these issues before continuing.
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs uppercase text-red-700">
                <tr>
                  <th className="py-2 pr-3">Row</th>
                  <th className="py-2 pr-3">Field</th>
                  <th className="py-2">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200 text-red-900">
                {result.errors.map((error, index) => (
                  <tr key={`${error.code}-${error.rowNumber ?? "header"}-${index}`}>
                    <td className="py-2 pr-3">{error.rowNumber ?? "-"}</td>
                    <td className="py-2 pr-3">{error.field ?? "-"}</td>
                    <td className="py-2">{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="mt-3 grid gap-2 text-sm text-red-900 sm:grid-cols-3">
            <div>
              <dt className="font-semibold">Participants found</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt className="font-semibold">Blank rows ignored</dt>
              <dd>{result.summary.blankRows}</dd>
            </div>
            <div>
              <dt className="font-semibold">Validation errors</dt>
              <dd>{result.errors.length}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
