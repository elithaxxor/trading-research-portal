import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { getSupabaseAdminConfig } from "./env";

// This client uses the Supabase secret/service-role key and bypasses RLS.
// Only use it from secure server-only code paths for trusted administrative
// tasks such as future webhooks or maintenance jobs.
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminConfig();

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
