import Link from "next/link";
import { FolderOpen, Home, User, Users } from "lucide-react";
import { Logo } from "./logo";

const tabs = [
  { href: "/participant/home", label: "Home", icon: Home },
  { href: "/participant/team", label: "Team", icon: Users },
  { href: "/participant/uploads", label: "Folder", icon: FolderOpen },
  { href: "/participant/profile", label: "Profile", icon: User },
];

export function ParticipantShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="mx-auto min-h-screen max-w-md bg-white pb-24 shadow-soft">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Logo href="/participant/home" />
            <Link
              href="/organizer/dashboard"
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-bu-red shadow-sm transition hover:border-bu-red hover:bg-bu-soft"
            >
              Switch to Organizer
            </Link>
          </div>
          <h1 className="mt-5 text-2xl font-black text-gray-950">{title}</h1>
        </header>
        <section className="px-5 py-6">{children}</section>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-gray-200 bg-white">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-gray-600 transition hover:text-bu-red"
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
