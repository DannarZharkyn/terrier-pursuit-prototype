"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isApprovedOrganizerEmail } from "@/lib/auth/organizer";

export function OrganizerLoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.user || !isApprovedOrganizerEmail(data.user.email)) {
        if (data.session) {
          await supabase.auth.signOut();
        }
        setError("Email or password is incorrect.");
        return;
      }

      const destination = nextPath?.startsWith("/organizer/")
        ? nextPath
        : "/organizer/dashboard";
      window.location.assign(destination);
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="label">Email</span>
        <input
          className="field mt-2"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input
          className="field mt-2"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn-primary w-full" type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {submitting ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
