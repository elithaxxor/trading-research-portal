import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { AdminOverviewStats } from "./types";

function throwAdminStatsError(): never {
  throw new Error("Unable to load admin overview stats.");
}

async function getIdeaCount(published?: boolean) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("trading_ideas").select("id", {
    count: "exact",
    head: true,
  });

  if (published !== undefined) {
    query = query.eq("published", published);
  }

  const { count, error } = await query;

  if (error) {
    throwAdminStatsError();
  }

  return count ?? 0;
}

async function getPostCount(published?: boolean) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("posts").select("id", {
    count: "exact",
    head: true,
  });

  if (published !== undefined) {
    query = query.eq("published", published);
  }

  const { count, error } = await query;

  if (error) {
    throwAdminStatsError();
  }

  return count ?? 0;
}

async function getTagCount() {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase.from("tags").select("id", {
    count: "exact",
    head: true,
  });

  if (error) {
    throwAdminStatsError();
  }

  return count ?? 0;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createSupabaseServerClient();
  const [
    totalIdeas,
    publishedIdeas,
    draftIdeas,
    totalPosts,
    publishedPosts,
    totalTags,
    latestUpdatesResult,
  ] = await Promise.all([
    getIdeaCount(),
    getIdeaCount(true),
    getIdeaCount(false),
    getPostCount(),
    getPostCount(true),
    getTagCount(),
    supabase
      .from("idea_updates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (latestUpdatesResult.error) {
    throwAdminStatsError();
  }

  return {
    draftIdeas,
    latestUpdates: latestUpdatesResult.data ?? [],
    publishedIdeas,
    publishedPosts,
    totalIdeas,
    totalPosts,
    totalTags,
  };
}
