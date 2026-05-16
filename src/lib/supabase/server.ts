import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

import { getSupabaseServerConfig } from "./env";

export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseServerConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // TODO Phase 3: move auth token refresh into middleware/proxy.
        }
      },
    },
  });
}
