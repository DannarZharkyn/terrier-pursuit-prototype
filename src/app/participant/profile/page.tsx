"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MapPin, MessageCircle, Ticket, User, Users } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";
import { useParticipantTeamChanges } from "@/hooks/use-participant-team-changes";
import type { CurrentTeamResponse, ParticipantTeam } from "@/lib/participant-teams/types";
import {
  readParticipantSession,
  type ParticipantSession,
} from "@/lib/participant-session";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<ParticipantSession>();
  const [team, setTeam] = useState<ParticipantTeam | null>();
  const [teamError, setTeamError] = useState<string>();

  useParticipantTeamChanges(() => {
    const storedSession = readParticipantSession();
    if (storedSession) void loadTeam(storedSession);
  });

  useEffect(() => {
    const storedSession = readParticipantSession();

    if (!storedSession) {
      router.replace("/participant/welcome");
      return;
    }

    setSession(storedSession);
    void loadTeam(storedSession);
  }, [router]);

  async function loadTeam(storedSession: ParticipantSession) {
    try {
      const params = new URLSearchParams({
        eventId: storedSession.event.id,
        participantId: storedSession.participant.id,
      });
      const response = await fetch(`/api/participant/teams?${params.toString()}`);
      const result = (await response.json()) as CurrentTeamResponse;

      if (!result.ok) {
        setTeamError("Team information could not be loaded.");
        return;
      }

      setTeam(result.team);
      setTeamError(undefined);
    } catch {
      setTeamError("Team information could not be loaded.");
    }
  }

  if (!session) {
    return null;
  }

  const fullName = `${session.participant.firstName} ${session.participant.lastName}`;

  return (
    <ParticipantShell title="Profile">
      <div className="space-y-5">
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bu-soft text-bu-red">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Participant Name</p>
              <h2 className="text-xl font-black text-gray-950">{fullName}</h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-white p-4">
              <User className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-xs font-semibold text-gray-500">First Name</p>
                <p className="text-sm font-bold text-gray-900">
                  {session.participant.firstName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white p-4">
              <User className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Last Name</p>
                <p className="text-sm font-bold text-gray-900">
                  {session.participant.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white p-4">
              <Mail className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Email</p>
                <p className="text-sm font-bold text-gray-900">
                  {session.participant.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white p-4">
              <Ticket className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Event</p>
                <p className="text-sm font-bold text-gray-900">
                  {session.event.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white p-4">
              <Ticket className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Game Code</p>
                <p className="text-sm font-bold uppercase text-gray-900">
                  {session.event.gameCode}
                </p>
              </div>
            </div>
            {team ? (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-bu-red" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Team Code for {team.name}</p>
                    <p className="mt-1 text-xl font-black uppercase text-bu-red">{team.teamCode}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-gray-600">
                  Share this code only with people joining your team. It is different from the game code above.
                </p>
              </div>
            ) : team === null ? (
              <div className="rounded-lg bg-white p-4 text-sm leading-6 text-gray-600">
                You are not on a team yet. Open the Team tab to create one, join one, or wait for organizer assignment.
              </div>
            ) : null}
            {teamError ? <p className="text-xs font-semibold text-red-700">{teamError}</p> : null}
          </div>
        </section>
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-bu-red" />
            <h3 className="text-lg font-black text-gray-950">Help & Contact</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            For event questions, game-code help, team assistance, or technical support, contact Student Wellbeing.
          </p>
          <a className="mt-4 flex items-center gap-3 rounded-lg bg-white p-4 text-sm font-bold text-bu-red" href="mailto:studentwellbeing@bu.edu">
            <Mail className="h-5 w-5 shrink-0" />studentwellbeing@bu.edu
          </a>
          <div className="mt-3 flex items-start gap-3 rounded-lg bg-white p-4 text-sm leading-6 text-gray-700">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-bu-red" />
            <address className="not-italic">Student Wellbeing<br />930 Commonwealth Ave, Suite 1020<br />Boston, MA</address>
          </div>
        </section>
      </div>
    </ParticipantShell>
  );
}
