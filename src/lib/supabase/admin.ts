import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig } from "./config";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
