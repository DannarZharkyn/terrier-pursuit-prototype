import { FindTeamRequestContent } from "@/components/find-team-request-content";
import { ParticipantShell } from "@/components/participant-shell";
import { PageBackLink } from "@/components/page-back-link";

export default function FindTeamPage() {
  return (
    <ParticipantShell title="Find Me a Team">
      <div className="mb-4">
        <PageBackLink href="/participant/team-options" label="Back to Team Options" />
      </div>
      <FindTeamRequestContent />
    </ParticipantShell>
  );
}
