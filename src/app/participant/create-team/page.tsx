import { CreateTeamForm } from "@/components/create-team-form";
import { ParticipantShell } from "@/components/participant-shell";
import { PageBackLink } from "@/components/page-back-link";

export default function CreateTeamPage() {
  return (
    <ParticipantShell title="Create Team">
      <div className="mb-4">
        <PageBackLink href="/participant/team-options" label="Back to Team Options" />
      </div>
      <CreateTeamForm />
    </ParticipantShell>
  );
}
