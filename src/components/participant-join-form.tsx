"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, XCircle } from "lucide-react";
import type { ParticipantJoinResponse } from "@/lib/participant-join/types";
import { saveParticipantSession } from "@/lib/participant-session";

type ParticipantJoinFormProps = {
  initialGameCode?: string;
};

export function ParticipantJoinForm({ initialGameCode = "" }: ParticipantJoinFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gameCode, setGameCode] = useState(initialGameCode);
  const [selfRegister, setSelfRegister] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string>();
  const [details, setDetails] = useState<string[]>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsJoining(true);
    setError(undefined);
    setDetails(undefined);

    try {
      const response = await fetch("/api/participant/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          gameCode,
          selfRegister,
        }),
      });
      const result = (await response.json()) as ParticipantJoinResponse;

      if (!result.ok) {
        setError(result.error);
        setDetails(result.details);
        return;
      }

      saveParticipantSession(result);
      router.push("/participant/disclaimer");
    } catch {
      setError("Could not reach the join API. Please try again.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <label className="block">
          <span className="label">First Name</span>
          <input
            className="field mt-2"
            placeholder="Alex"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Last Name</span>
          <input
            className="field mt-2"
            placeholder="Morgan"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input
            className="field mt-2"
            placeholder="alex@bu.edu"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Game Code</span>
          <input
            className="field mt-2 uppercase"
            placeholder="ABC123"
            value={gameCode}
            onChange={(event) => setGameCode(event.target.value)}
          />
          <span className="mt-2 block text-xs font-semibold leading-5 text-gray-600">
            The game code identifies your event. Get it from a teammate, orientation leader, event organizer, or administrator.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <input
            className="mt-1 h-4 w-4 accent-red-600"
            type="checkbox"
            checked={selfRegister}
            onChange={(event) => setSelfRegister(event.target.checked)}
          />
          <span>
            <span className="block text-sm font-bold text-gray-900">
              I was not pre-registered
            </span>
            <span className="mt-1 block text-sm leading-5 text-gray-600">
              Joining spontaneously? Select this option to register, get the game code from someone participating or managing the event, then join the appropriate team after signing in.
            </span>
          </span>
        </label>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-900">
          Already uploaded or pre-registered? Leave the box unchecked and sign in with the same name and email used by the organizer. You will choose whether to create or join a team next.
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-800">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
          {details?.length ? (
            <ul className="mt-3 space-y-1 text-sm leading-6 text-red-900">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 grid gap-3">
        <button
          className="btn-primary disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          type="submit"
          disabled={isJoining}
        >
          {isJoining
            ? selfRegister
              ? "Registering..."
              : "Joining..."
            : selfRegister
              ? "Register & Sign In"
              : "Sign In"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
