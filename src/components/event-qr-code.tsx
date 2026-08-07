"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import QRCode from "qrcode";

type EventQrCodeProps = {
  eventName: string;
  gameCode: string;
  participantUrl: string;
};

export function EventQrCode({ eventName, gameCode, participantUrl }: EventQrCodeProps) {
  const [imageUrl, setImageUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(participantUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111827", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) {
          setImageUrl(url);
          setError(undefined);
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not generate the QR code. Please use the participant link instead.");
        }
      });

    return () => {
      active = false;
    };
  }, [participantUrl]);

  async function copyLink() {
    await navigator.clipboard.writeText(participantUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const downloadName = `${eventName || "event"}-${gameCode}-qr-code`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <details className="group mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-gray-50 px-5 py-4 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-bu-red [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-bu-red" />
          <span className="font-black text-gray-950">Participant QR Code</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-gray-200 p-5">
        <p className="mt-1 text-sm leading-5 text-gray-600">
          Participants can scan this code to open sign-in with game code {gameCode} already filled in.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
          <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-lg border border-gray-200 bg-white p-2">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`QR code for ${eventName}`}
                width={204}
                height={204}
                unoptimized
                priority
              />
            ) : (
              <p className="px-4 text-center text-sm font-semibold text-gray-500">
                {error ?? "Generating QR code..."}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Regular participant link
            </p>
            <p className="mt-2 break-all rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              {participantUrl}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {imageUrl ? (
                <a className="btn-primary" href={imageUrl} download={`${downloadName}.png`}>
                  <Download className="h-4 w-4" />
                  Download QR Code
                </a>
              ) : null}
              <button className="btn-secondary" type="button" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
              <a className="btn-secondary" href={participantUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open Participant Link
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              The QR image is generated when this page opens and is not permanently stored. Manual game-code sign-in remains available.
            </p>
          </div>
        </div>
      </div>
    </details>
  );
}
