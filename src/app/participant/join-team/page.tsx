import { ParticipantShell } from "@/components/participant-shell";
import { JoinTeamForm } from "@/components/join-team-form";
import { PageBackLink } from "@/components/page-back-link";

export default function JoinTeamPage() {
  return (
    <ParticipantShell title="Join Team">
      <div className="mb-4">
        <PageBackLink href="/participant/team-options" label="Back to Team Options" />
      </div>
      <JoinTeamForm />
    </ParticipantShell>
  );
}
