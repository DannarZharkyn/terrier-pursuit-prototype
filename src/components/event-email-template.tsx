"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

type EventEmailTemplateProps = {
  recipients: string;
  subject: string;
  body: string;
};

export function EventEmailTemplate({
  recipients,
  subject: initialSubject,
  body: initialBody,
}: EventEmailTemplateProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [copied, setCopied] = useState<string>();

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(undefined), 1800);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-bu-red" />
        <div>
          <h2 className="text-lg font-black text-gray-950">Participant Invitation Email</h2>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <CopyField
          label="BCC recipients"
          value={recipients}
          copied={copied === "recipients"}
          onCopy={() => copyValue("recipients", recipients)}
          multiline
          readOnly
        />
        <CopyField
          label="Subject"
          value={subject}
          copied={copied === "subject"}
          onCopy={() => copyValue("subject", subject)}
          onChange={setSubject}
        />
        <CopyField
          label="Message"
          value={body}
          copied={copied === "body"}
          onCopy={() => copyValue("body", body)}
          onChange={setBody}
          multiline
        />
      </div>

      <ol className="mt-5 list-decimal space-y-1 pl-5 text-xs leading-5 text-gray-600">
        <li>Open Gmail and start a new message.</li>
        <li>Put your own address in To and paste the participant addresses into BCC.</li>
        <li>Paste the subject and message, review them, and send.</li>
      </ol>
    </section>
  );
}

function CopyField({
  label,
  value,
  copied,
  onCopy,
  onChange,
  multiline = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  onChange?: (value: string) => void;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  const classes = `field mt-2 ${multiline ? "min-h-28 resize-y" : ""}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="label">{label}</label>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-bu-red transition hover:bg-red-50"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {multiline ? (
        <textarea
          className={classes}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <input
          className={classes}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </div>
  );
}
