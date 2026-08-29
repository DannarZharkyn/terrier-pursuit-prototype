import Image from "next/image";
import { Camera, MapPin } from "lucide-react";
import { DetectiveTerrier } from "@/components/detective-terrier";

export function ParticipantStoryHero({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`participant-hero relative isolate overflow-hidden text-white ${compact ? "participant-hero-compact h-[17.5rem] rounded-[1.5rem]" : "participant-hero-welcome min-h-[35.5rem]"}`}
    >
      <Image
        src="/images/participant-stories/tea-cup.jpg"
        alt="Terrier Pursuit students exploring Boston together"
        fill
        className="participant-hero-photo object-cover"
        priority={!compact}
        sizes="(max-width: 448px) 100vw, 448px"
      />
      <div className="participant-hero-shade absolute inset-0" />
      <div className="absolute inset-0 participant-map-grid opacity-35" />
      <div className="absolute -left-16 top-20 h-40 w-40 rounded-full border border-white/25" />
      <div className="absolute -left-8 top-28 h-24 w-24 rounded-full border border-white/20" />
      <div className="absolute right-4 top-5 rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur">
        Case file: Boston
      </div>
      <DetectiveTerrier
        className={compact ? "absolute -right-6 bottom-0 h-44" : "absolute -right-9 bottom-0 h-64"}
      />
      <div className={`participant-hero-copy absolute inset-x-0 ${compact ? "p-5 pr-28" : "p-6 pr-28"}`}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-100">
          <Camera className="h-4 w-4" /> Real teams. Real Boston.
        </p>
        <h2 className={`hunt-display mt-2 uppercase leading-[0.92] ${compact ? "text-[2.25rem]" : "text-[2.65rem]"}`}>
          Crack clues.<br />
          Find Boston.
        </h2>
        {!compact ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/85">
            <MapPin className="h-4 w-4 text-red-300" /> Your team. Your city. Your story.
          </p>
        ) : null}
      </div>
    </section>
  );
}
