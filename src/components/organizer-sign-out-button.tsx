"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function OrganizerSignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/organizer/login");
  }

  return (
    <button className="btn-secondary w-full" type="button" onClick={signOut} disabled={signingOut}>
      <LogOut className="h-4 w-4" />
      {signingOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
