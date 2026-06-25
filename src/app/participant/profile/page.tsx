import { Mail, MessageCircle, User } from "lucide-react";
import { ParticipantShell } from "@/components/participant-shell";

export default function ProfilePage() {
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
              <h2 className="text-xl font-black text-gray-950">Maya Patel</h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-white p-4">
              <Mail className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-xs font-semibold text-gray-500">BU Email</p>
                <p className="text-sm font-bold text-gray-900">maya.patel@bu.edu</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white p-4">
              <User className="h-5 w-5 text-bu-red" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Team Name</p>
                <p className="text-sm font-bold text-gray-900">Kenmore Crawlers</p>
              </div>
            </div>
          </div>
        </section>
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-bu-red" />
            <h3 className="text-lg font-black text-gray-950">Help & Contact</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Event desk: GSU lobby. Email: terrierpursuit@bu.edu.
          </p>
        </section>
      </div>
    </ParticipantShell>
  );
}
