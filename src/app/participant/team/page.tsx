import { ParticipantShell } from "@/components/participant-shell";
import { TeamOptionsContent } from "@/components/team-options-content";

export default function MyTeamPage() {
  return (
    <ParticipantShell title="My Team">
      <TeamOptionsContent />
    </ParticipantShell>
  );
}
