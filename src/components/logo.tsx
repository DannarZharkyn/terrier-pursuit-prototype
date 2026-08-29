import Link from "next/link";

type LogoProps = {
  href?: string;
};

export function Logo({ href = "/" }: LogoProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-bu-red text-lg font-black tracking-normal text-white shadow-sm">
        <span className="absolute inset-1 rounded-lg border border-white/30" />
        <span className="relative">TP</span>
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-black text-current">
          Terrier Pursuit
        </span>
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
          Boston Hunt
        </span>
      </span>
    </Link>
  );
}
