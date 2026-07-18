import { ParticipantShell } from "@/components/participant-shell";
import { JoinTeamForm } from "@/components/join-team-form";

export default function JoinTeamPage() {
  return (
    <ParticipantShell title="Join Team">
      <JoinTeamForm />
    </ParticipantShell>
  );
}
