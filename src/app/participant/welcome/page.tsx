import { unstable_noStore as noStore } from "next/cache";
import { Logo } from "@/components/logo";
import { ParticipantJoinForm } from "@/components/participant-join-form";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDataEnvironment } from "@/lib/data-environment";
import { ParticipantStoryHero } from "@/components/participant-story-hero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParticipantWelcomePage({
  searchParams,
}: {
  searchParams?: { gameCode?: string | string[]; event?: string | string[] };
}) {
  noStore();
  const requestedCode = Array.isArray(searchParams?.gameCode)
    ? searchParams?.gameCode[0]
    : searchParams?.gameCode;
  const normalizedCode = requestedCode?.trim().toUpperCase() ?? "";
  const requestedEventId = Array.isArray(searchParams?.event)
    ? searchParams?.event[0]
    : searchParams?.event;
  const validCode = normalizedCode
    ? await publishedGameCode(normalizedCode, requestedEventId?.trim())
    : "";
  const invalidEventLink = Boolean(normalizedCode && !validCode);

  return (
    <main className="participant-world min-h-screen">
      <section className="mx-auto min-h-screen max-w-md overflow-hidden bg-[#f4ede1] shadow-2xl">
        <ParticipantStoryHero />
        <div className="relative px-5 pb-10 pt-8">
        <div className="absolute inset-0 participant-paper-texture opacity-50" />
        <div className="relative">
        <div className="mb-8">
          <Logo href="/participant/welcome" />
          <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-bu-red">Your mission begins here</p>
          <h1 className="hunt-display mt-2 text-4xl uppercase leading-none text-gray-950">
            Enter the hunt
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Enter your details and event code to join your event.
          </p>
          {validCode ? (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
              Game code {validCode} was added from the event link.
            </p>
          ) : null}
          {invalidEventLink ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              This event link is no longer valid. You can still enter another game code below.
            </p>
          ) : null}
        </div>
        <ParticipantJoinForm initialGameCode={validCode} />
        </div>
        </div>
      </section>
    </main>
  );
}

async function publishedGameCode(gameCode: string, eventId?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("events")
    .select("game_code")
    .eq("game_code", gameCode)
    .eq("status", "published")
    .eq("data_environment", getDataEnvironment());

  if (eventId) {
    query = query.eq("id", eventId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return "";
  }

  return (data.game_code as string | null) ?? "";
}
