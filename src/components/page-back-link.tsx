import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageBackLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-bu-red focus:outline-none focus:ring-2 focus:ring-bu-red ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
