import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { getSupabaseBrowserConfig } from "./env";

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseBrowserConfig();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
