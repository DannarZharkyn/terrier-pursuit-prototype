"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, Pencil, Save, ScrollText, ShieldCheck, Users, X, XCircle } from "lucide-react";
import { createEventInvitationEmail } from "@/lib/email/event-invitation";
import type { PlatformTemplates } from "@/lib/templates/defaults";

type TemplateSection = "rules" | "disclaimer" | "invitationEmail" | "participantInstructions";

export function PlatformTemplatesEditor({ initialTemplates }: { initialTemplates: PlatformTemplates }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [drafts, setDrafts] = useState(initialTemplates);
  const [editing, setEditing] = useState<TemplateSection>();
  const [saving, setSaving] = useState<TemplateSection>();
  const [success, setSuccess] = useState<string>();
  const [error, setError] = useState<string>();
  const emailPreview = createEmailPreview(templates);

  function startEditing(section: TemplateSection) {
    setDrafts(templates);
    setEditing(section);
    setSuccess(undefined);
    setError(undefined);
  }

  function cancelEditing() {
    setDrafts(templates);
    setEditing(undefined);
    setError(undefined);
  }

  async function saveSection(section: TemplateSection) {
    setSaving(section);
    setSuccess(undefined);
    setError(undefined);

    const values = sectionValues(section, drafts);

    try {
      const response = await fetch("/api/organizer/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, values }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!result.ok) {
        setError(result.error ?? "Could not save the template.");
        return;
      }

      setTemplates((current) => ({ ...current, ...values }));
      setEditing(undefined);
      setSuccess(`${sectionLabel(section)} saved. It will be used for future games only.`);
    } catch {
      setError("Could not reach the template API. Please try again.");
    } finally {
      setSaving(undefined);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Changes apply only to future games</p>
            <p className="mt-1 text-sm leading-6">
              Existing games keep the text saved when they were created. Editing an individual game will not change these platform defaults.
            </p>
          </div>
        </div>
      </div>

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
          <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{success}</span>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          <span className="flex items-center gap-2"><XCircle className="h-4 w-4" />{error}</span>
        </div>
      ) : null}

      <TemplateCard
        title="Game Rules"
        description="Default participant rules copied into every newly created game."
        icon={<ScrollText className="h-5 w-5" />}
        editing={editing === "rules"}
        saving={saving === "rules"}
        onEdit={() => startEditing("rules")}
        onCancel={cancelEditing}
        onSave={() => saveSection("rules")}
      >
        {editing === "rules" ? (
          <textarea className="field min-h-[26rem] resize-y" value={drafts.rules} onChange={(event) => setDrafts({ ...drafts, rules: event.target.value })} />
        ) : <TemplateText value={templates.rules} />}
      </TemplateCard>

      <TemplateCard
        title="Participant Disclaimer or Waiver"
        description="Default acknowledgment participants must accept before entering a new game."
        icon={<ShieldCheck className="h-5 w-5" />}
        editing={editing === "disclaimer"}
        saving={saving === "disclaimer"}
        onEdit={() => startEditing("disclaimer")}
        onCancel={cancelEditing}
        onSave={() => saveSection("disclaimer")}
      >
        {editing === "disclaimer" ? (
          <textarea className="field min-h-[26rem] resize-y" value={drafts.disclaimer} onChange={(event) => setDrafts({ ...drafts, disclaimer: event.target.value })} />
        ) : <TemplateText value={templates.disclaimer} />}
      </TemplateCard>

      <TemplateCard
        title="Participant Instructions"
        description="Reusable steps inserted into the invitation email through the {{participantInstructions}} variable."
        icon={<Users className="h-5 w-5" />}
        editing={editing === "participantInstructions"}
        saving={saving === "participantInstructions"}
        onEdit={() => startEditing("participantInstructions")}
        onCancel={cancelEditing}
        onSave={() => saveSection("participantInstructions")}
      >
        {editing === "participantInstructions" ? (
          <textarea className="field min-h-52 resize-y" value={drafts.participantInstructions} onChange={(event) => setDrafts({ ...drafts, participantInstructions: event.target.value })} />
        ) : <TemplateText value={templates.participantInstructions} />}
      </TemplateCard>

      <TemplateCard
        title="Participant Invitation Email"
        description="Default subject and message rendered with the details of each new game."
        icon={<Mail className="h-5 w-5" />}
        editing={editing === "invitationEmail"}
        saving={saving === "invitationEmail"}
        onEdit={() => startEditing("invitationEmail")}
        onCancel={cancelEditing}
        onSave={() => saveSection("invitationEmail")}
      >
        {editing === "invitationEmail" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-900">
              Keep these variables wherever the event information should appear: {"{{eventName}}"}, {"{{startsAt}}"}, {"{{submissionDeadline}}"}, {"{{gameCode}}"}, {"{{participantUrl}}"}, {"{{participantInstructions}}"}, and {"{{rules}}"}. They are replaced automatically in the finished email.
            </div>
            <label className="block"><span className="label">Email Subject</span><input className="field mt-2" value={drafts.emailSubject} onChange={(event) => setDrafts({ ...drafts, emailSubject: event.target.value })} /></label>
            <label className="block"><span className="label">Email Message</span><textarea className="field mt-2 min-h-[30rem] resize-y" value={drafts.emailBody} onChange={(event) => setDrafts({ ...drafts, emailBody: event.target.value })} /></label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold leading-5 text-green-900">
              Example preview — event details and the participant link will be filled in automatically for each new game.
            </div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Subject</p><p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-800">{emailPreview.subject}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Message</p><TemplateText value={emailPreview.body} /></div>
          </div>
        )}
      </TemplateCard>
    </div>
  );
}

function TemplateCard({ title, description, icon, editing, saving, onEdit, onCancel, onSave, children }: {
  title: string; description: string; icon: React.ReactNode; editing: boolean; saving: boolean;
  onEdit: () => void; onCancel: () => void; onSave: () => void; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
      <header className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3"><span className="mt-0.5 text-bu-red">{icon}</span><div><h2 className="font-black text-gray-950">{title}</h2><p className="mt-1 text-sm leading-5 text-gray-600">{description}</p></div></div>
        {!editing ? <button className="btn-secondary min-h-9 shrink-0 px-3 py-2" type="button" onClick={onEdit}><Pencil className="h-4 w-4" />Edit</button> : null}
      </header>
      <div className="p-5">{children}</div>
      {editing ? (
        <footer className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-end">
          <button className="btn-secondary" type="button" onClick={onCancel} disabled={saving}><X className="h-4 w-4" />Cancel</button>
          <button className="btn-primary" type="button" onClick={onSave} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Changes"}</button>
        </footer>
      ) : null}
    </section>
  );
}

function TemplateText({ value }: { value: string }) {
  return <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">{value}</p>;
}

function sectionValues(section: TemplateSection, templates: PlatformTemplates): Partial<PlatformTemplates> {
  if (section === "rules") return { rules: templates.rules };
  if (section === "disclaimer") return { disclaimer: templates.disclaimer };
  if (section === "participantInstructions") return { participantInstructions: templates.participantInstructions };
  return { emailSubject: templates.emailSubject, emailBody: templates.emailBody };
}

function sectionLabel(section: TemplateSection) {
  if (section === "rules") return "Game rules template";
  if (section === "disclaimer") return "Participant disclaimer template";
  if (section === "participantInstructions") return "Participant instructions template";
  return "Invitation email template";
}

function createEmailPreview(templates: PlatformTemplates) {
  return createEventInvitationEmail({
    eventName: "Example Terrier Pursuit Game",
    gameCode: "ABC234",
    startsAt: "2026-09-15T14:00:00.000Z",
    submissionDeadline: "2026-09-15T18:00:00.000Z",
    rules: "The game rules saved for this event will appear here.",
    participantUrl:
      "https://terrier-pursuit-prototype.vercel.app/participant/welcome?gameCode=ABC234",
    templates,
  });
}
