import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";
import { PlatformTemplatesEditor } from "@/components/platform-templates-editor";
import { getPlatformTemplates } from "@/lib/templates/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizerTemplatesPage() {
  const templates = await getPlatformTemplates();

  return (
    <OrganizerShell
      title="Default Templates"
      subtitle="Manage the platform text copied into newly created Terrier Pursuit games."
    >
      <div className="mb-5"><PageBackLink href="/organizer/dashboard" label="Back to Dashboard" /></div>
      <div className="mb-6 rounded-lg bg-bu-red p-5 text-white shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-red-100">Platform defaults</p>
        <h2 className="mt-2 text-xl font-black">Templates for future games</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-red-50">When a new game is started, the current templates are copied into that game. The organizer may then customize that game independently.</p>
      </div>
      <PlatformTemplatesEditor initialTemplates={templates} />
    </OrganizerShell>
  );
}
