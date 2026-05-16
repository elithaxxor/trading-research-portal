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
          // `@supabase/ssr` represents both cookie writes and removals through
          // setAll, including removal options such as maxAge: 0.
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies. The Phase 3 middleware
          // step should refresh auth tokens before protected pages render.
        }
      },
    },
  });
}
