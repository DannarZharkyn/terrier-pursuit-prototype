import { Logo } from "@/components/logo";
import { ParticipantJoinForm } from "@/components/participant-join-form";

export default function ParticipantWelcomePage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-5 py-8 shadow-soft">
        <div className="mb-8">
          <Logo href="/participant/welcome" />
          <h1 className="mt-8 text-3xl font-black text-gray-950">
            Join the Event
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Enter your details and event code to join your event.
          </p>
        </div>
        <ParticipantJoinForm />
      </section>
    </main>
  );
}
