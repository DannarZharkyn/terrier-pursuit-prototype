import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DeleteEventResponse =
  | {
      ok: true;
      deletedEventId: string;
    }
  | {
      ok: false;
      error: string;
    };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: { eventId: string } },
) {
  const eventId = params.eventId;

  if (!uuidPattern.test(eventId)) {
    return json({ ok: false, error: "Event ID is invalid." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("events")
    .delete({ count: "exact" })
    .eq("id", eventId);

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  if (count === 0) {
    return json({ ok: false, error: "Event was not found." }, 404);
  }

  revalidatePath("/organizer/dashboard");
  revalidatePath(`/organizer/event/${eventId}`);

  return json({ ok: true, deletedEventId: eventId });
}

function json(response: DeleteEventResponse, status = 200) {
  return NextResponse.json(response, { status });
}
