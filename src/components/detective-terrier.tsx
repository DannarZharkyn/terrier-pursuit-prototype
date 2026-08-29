import Image from "next/image";

export function DetectiveTerrier({ className = "" }: { className?: string }) {
  return (
    <div className={`detective-terrier pointer-events-none select-none ${className}`} aria-hidden="true">
      <span className="terrier-ping terrier-ping-one" />
      <span className="terrier-ping terrier-ping-two" />
      <Image
        src="/images/participant-stories/detective-terrier.png"
        alt=""
        width={1024}
        height={1536}
        className="relative h-full w-auto object-contain drop-shadow-[0_18px_18px_rgba(22,13,10,0.35)]"
        sizes="240px"
      />
    </div>
  );
}
