import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type UserActivityState =
  Database["public"]["Tables"]["user_activity_state"]["Row"];
export type RecentlyUpdatedIdea =
  Pick<
    Database["public"]["Tables"]["trading_ideas"]["Row"],
    | "id"
    | "last_lifecycle_event_at"
    | "outcome"
    | "slug"
    | "status"
    | "ticker"
    | "title"
    | "updated_at"
    | "visibility"
  >;
export type DashboardLifecycleIdea = Pick<
  Database["public"]["Tables"]["trading_ideas"]["Row"],
  | "id"
  | "last_lifecycle_event_at"
  | "outcome"
  | "review_published"
  | "slug"
  | "status"
  | "ticker"
  | "title"
  | "updated_at"
  | "visibility"
>;
type UserActivityInsert =
  Database["public"]["Tables"]["user_activity_state"]["Insert"];

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

async function updateSeenColumn(
  column:
    | "last_dashboard_seen_at"
    | "last_ideas_seen_at"
    | "last_lifecycle_seen_at"
    | "last_research_seen_at",
  timestamp = new Date().toISOString()
) {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  let payload: UserActivityInsert;

  switch (column) {
    case "last_dashboard_seen_at":
      payload = {
        last_dashboard_seen_at: timestamp,
        user_id: userId,
      };
      break;
    case "last_ideas_seen_at":
      payload = {
        last_ideas_seen_at: timestamp,
        user_id: userId,
      };
      break;
    case "last_lifecycle_seen_at":
      payload = {
        last_lifecycle_seen_at: timestamp,
        user_id: userId,
      };
      break;
    case "last_research_seen_at":
      payload = {
        last_research_seen_at: timestamp,
        user_id: userId,
      };
      break;
  }

  const { data, error } = await supabase
    .from("user_activity_state")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update user activity state.");
  }

  return data;
}

export async function getUserActivityState() {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_activity_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load user activity state.");
  }

  return data;
}

export async function ensureUserActivityState() {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const existing = await getUserActivityState();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("user_activity_state")
    .insert({
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to create user activity state.");
  }

  return data;
}

export async function updateDashboardSeenAt(timestamp?: string) {
  return updateSeenColumn("last_dashboard_seen_at", timestamp);
}

export async function updateIdeasSeenAt(timestamp?: string) {
  return updateSeenColumn("last_ideas_seen_at", timestamp);
}

export async function updateResearchSeenAt(timestamp?: string) {
  return updateSeenColumn("last_research_seen_at", timestamp);
}

export async function updateLifecycleSeenAt(timestamp?: string) {
  return updateSeenColumn("last_lifecycle_seen_at", timestamp);
}

export async function getNewLifecycleCountSince(timestamp: string | null) {
  if (!timestamp) {
    return 0;
  }

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("idea_updates")
    .select("id", { count: "exact", head: true })
    .gt("event_at", timestamp);

  if (error) {
    throw new Error("Unable to count new lifecycle updates.");
  }

  return count ?? 0;
}

export async function getRecentlyUpdatedIdeasSince(timestamp: string | null) {
  if (!timestamp) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trading_ideas")
    .select(
      "id,last_lifecycle_event_at,outcome,slug,status,ticker,title,updated_at,visibility"
    )
    .eq("published", true)
    .or(
      `updated_at.gt.${timestamp},last_lifecycle_event_at.gt.${timestamp}`
    )
    .order("last_lifecycle_event_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error("Unable to load recently updated ideas.");
  }

  return data ?? [];
}

export async function getLifecycleIdeaDetailsBySlugs(
  slugs: string[]
): Promise<DashboardLifecycleIdea[]> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map((slug) => slug.trim()).filter(Boolean))
  );

  if (uniqueSlugs.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trading_ideas")
    .select(
      "id,last_lifecycle_event_at,outcome,review_published,slug,status,ticker,title,updated_at,visibility"
    )
    .eq("published", true)
    .in("slug", uniqueSlugs);

  if (error) {
    throw new Error("Unable to load lifecycle idea details.");
  }

  return data ?? [];
}
