import Image from "next/image";
import { Camera, MapPin } from "lucide-react";

export function ParticipantStoryHero({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`relative isolate overflow-hidden bg-gray-950 text-white ${compact ? "h-52 rounded-xl" : "h-80"}`}>
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="relative row-span-2">
          <Image src="/images/participant-stories/tea-cup.jpg" alt="Terrier Pursuit participants exploring Boston" fill className="object-cover" priority={!compact} sizes="(max-width: 448px) 50vw, 224px" />
        </div>
        <div className="relative">
          <Image src="/images/participant-stories/old-north-church.jpg" alt="A Terrier Pursuit team at the Old North Church" fill className="object-cover" sizes="(max-width: 448px) 50vw, 224px" />
        </div>
        <div className="relative">
          <Image src="/images/participant-stories/skinny-house.jpg" alt="A Terrier Pursuit team finding a Boston landmark" fill className="object-cover" sizes="(max-width: 448px) 50vw, 224px" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/45 to-bu-red/15" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-100">
          <Camera className="h-4 w-4" /> Real teams. Real Boston.
        </p>
        <h2 className={`mt-2 font-black leading-tight ${compact ? "text-2xl" : "text-3xl"}`}>
          Find the city.<br />Make the memory.
        </h2>
        {!compact ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/85">
            <MapPin className="h-4 w-4 text-red-300" /> Your next Boston adventure starts here.
          </p>
        ) : null}
      </div>
    </section>
  );
}
