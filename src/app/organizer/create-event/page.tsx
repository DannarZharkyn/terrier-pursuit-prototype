import { CreateEventForm } from "@/components/create-event-form";
import { OrganizerShell } from "@/components/organizer-shell";
import { PageBackLink } from "@/components/page-back-link";
import { builtInPlatformTemplates } from "@/lib/templates/defaults";
import { getPlatformTemplates } from "@/lib/templates/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreateEventPage() {
  const supabase = createSupabaseAdminClient();
  const [templates, masterResult] = await Promise.all([
    getPlatformTemplates().catch(() => builtInPlatformTemplates),
    supabase.from("master_locations")
      .select("id, landmark, location_url, clue, campus_population")
      .eq("active", true)
      .order("landmark"),
  ]);
  const masterLocations = (masterResult.data ?? []).map((location) => ({
    id: location.id as string,
    landmark: location.landmark as string,
    locationUrl: location.location_url as string,
    clue: location.clue as string,
    campusPopulation: location.campus_population as string,
  }));

  return (
    <OrganizerShell
      title="Create Event"
      subtitle="Complete the event details and upload validated spreadsheets before publishing."
    >
      <div className="mb-5">
        <PageBackLink href="/organizer/dashboard" label="Back to Dashboard" />
      </div>
      <CreateEventForm initialTemplates={templates} masterLocations={masterLocations} />
    </OrganizerShell>
  );
}
