import { createSupabaseServerClient } from "@/lib/supabase/server";

import { SiteHeaderClient } from "./site-header-client";

async function getIsAuthenticated() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return Boolean(user);
  } catch {
    return false;
  }
}

export async function SiteHeader() {
  const isAuthenticated = await getIsAuthenticated();

  return <SiteHeaderClient isAuthenticated={isAuthenticated} />;
}
