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
      <div className="participant-world min-h-screen overflow-x-hidden">
      <main className="participant-stage relative mx-auto min-h-screen max-w-md pb-28 shadow-2xl">
        <header className="sticky top-0 z-20 border-b border-white/15 bg-[#1d1010]/90 px-4 py-4 text-white backdrop-blur-xl sm:px-5">
          <Logo href="/participant/home" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-red-200">Terrier field journal</p>
          <h1 className="hunt-display mt-1 text-3xl uppercase leading-none text-white">{title}</h1>
        </header>
        <section className="relative z-10 px-4 py-5 sm:px-5 sm:py-6">{children}</section>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-white/15 bg-[#1d1010]/95 text-white shadow-[0_-12px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]" aria-label="Participant navigation">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-bold text-white/70 transition hover:-translate-y-0.5 hover:text-white"
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
