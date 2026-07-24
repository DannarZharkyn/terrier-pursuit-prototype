import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { EditEventForm } from "@/components/edit-event-form";
import { OrganizerShell } from "@/components/organizer-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  noStore();
  const supabase = createSupabaseAdminClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, name, starts_at, submission_deadline, rules")
    .eq("id", params.eventId)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  return (
    <OrganizerShell
      title="Edit Game"
      subtitle="Update the game name, start time, or rules."
    >
      <EditEventForm
        event={{
          id: event.id as string,
          name: event.name as string,
          startsAt: (event.starts_at as string | null) ?? new Date().toISOString(),
          submissionDeadline: (event.submission_deadline as string | null) ?? new Date().toISOString(),
          rules: (event.rules as string | null) ?? "",
        }}
      />
    </OrganizerShell>
  );
}
