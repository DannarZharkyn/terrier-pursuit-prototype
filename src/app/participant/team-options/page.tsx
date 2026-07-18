import { ParticipantShell } from "@/components/participant-shell";
import { TeamOptionsContent } from "@/components/team-options-content";

export default function TeamOptionsPage() {
  return (
    <ParticipantShell title="Choose Team Option">
      <TeamOptionsContent />
    </ParticipantShell>
  );
}
