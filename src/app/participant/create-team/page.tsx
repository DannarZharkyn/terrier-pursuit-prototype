import { CreateTeamForm } from "@/components/create-team-form";
import { ParticipantShell } from "@/components/participant-shell";

export default function CreateTeamPage() {
  return (
    <ParticipantShell title="Create Team">
      <CreateTeamForm />
    </ParticipantShell>
  );
}
