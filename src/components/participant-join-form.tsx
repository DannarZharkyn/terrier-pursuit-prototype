"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, XCircle } from "lucide-react";
import type { ParticipantJoinResponse } from "@/lib/participant-join/types";
import { saveParticipantSession } from "@/lib/participant-session";

export function ParticipantJoinForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gameCode, setGameCode] = useState("");
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
        }),
      });
      const result = (await response.json()) as ParticipantJoinResponse;

      if (!result.ok) {
        setError(result.error);
        setDetails(result.details);
        return;
      }

      saveParticipantSession(result);
      router.push("/participant/team-options");
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
        </label>
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
          {isJoining ? "Joining..." : "Sign In"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
