import { FindTeamRequestContent } from "@/components/find-team-request-content";
import { ParticipantShell } from "@/components/participant-shell";

export default function FindTeamPage() {
  return (
    <ParticipantShell title="Find Me a Team">
      <FindTeamRequestContent />
    </ParticipantShell>
  );
}
