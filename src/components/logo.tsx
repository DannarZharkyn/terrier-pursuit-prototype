import Link from "next/link";

type LogoProps = {
  href?: string;
};

export function Logo({ href = "/" }: LogoProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-bu-red text-lg font-black tracking-normal text-white shadow-sm">
        TP
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-black text-gray-950">
          Terrier Pursuit
        </span>
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-bu-red">
          Boston Hunt
        </span>
      </span>
    </Link>
  );
}
