import Link from "next/link";
import { FolderOpen, Home, User, Users } from "lucide-react";
import { Logo } from "./logo";
import { ParticipantConsentGate } from "./participant-consent-gate";
import { ParticipantRealtimeSync } from "./participant-realtime-sync";
import { ParticipantRulesUpdateGate } from "./participant-rules-update-gate";

const tabs = [
  { href: "/participant/home", label: "Home", icon: Home },
  { href: "/participant/team-options", label: "Team", icon: Users },
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
    <ParticipantConsentGate>
      <ParticipantRulesUpdateGate>
      <ParticipantRealtimeSync />
      <div className="min-h-screen overflow-x-hidden bg-gray-100">
      <main className="mx-auto min-h-screen max-w-md bg-white pb-28 shadow-soft">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-5">
          <Logo href="/participant/home" />
          <h1 className="mt-4 text-2xl font-black leading-tight text-gray-950">{title}</h1>
        </header>
        <section className="px-4 py-5 sm:px-5 sm:py-6">{children}</section>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Participant navigation">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-semibold text-gray-600 transition hover:text-bu-red"
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
      </div>
      </ParticipantRulesUpdateGate>
    </ParticipantConsentGate>
  );
}
