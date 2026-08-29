import Link from "next/link";
import { FolderOpen, Home, User, Users } from "lucide-react";
import { Logo } from "./logo";
import { ParticipantConsentGate } from "./participant-consent-gate";
import { ParticipantRealtimeSync } from "./participant-realtime-sync";
import { ParticipantRulesUpdateGate } from "./participant-rules-update-gate";
import { ParticipantScrollArtifacts } from "./participant-scroll-artifacts";
import { DetectiveTerrier } from "./detective-terrier";

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
        <div className="participant-route-art participant-route-art-left" aria-hidden="true">
          <span className="participant-route-dot" />
          <span className="participant-route-label">42.3601° N</span>
        </div>
        <div className="participant-route-art participant-route-art-right" aria-hidden="true">
          <span className="participant-route-compass">N</span>
          <span className="participant-route-label">BOSTON</span>
        </div>
        <ParticipantScrollArtifacts />
        <header className="participant-journal-header sticky top-0 z-20 overflow-hidden border-b border-white/15 bg-[#1d1010]/90 px-4 py-4 text-white backdrop-blur-xl sm:px-5">
          <div className="participant-header-orbit" aria-hidden="true" />
          <DetectiveTerrier className="participant-header-terrier absolute -right-2 bottom-0 h-[8.5rem]" />
          <div className="relative z-10">
          <div className="max-w-[72%]"><Logo href="/participant/home" /></div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-red-200">Terrier field journal</p>
          <h1 className="hunt-display relative z-10 mt-1 pr-2 text-3xl uppercase leading-none text-white">{title}</h1>
          </div>
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
