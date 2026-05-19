import "server-only";

import { getIdeaPreviews } from "@/lib/content/ideas";
import type { IdeaPreview } from "@/lib/content/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { listFollowedTickers } from "./followed-tickers";
import { ensureMemberPreferences } from "./preferences";
import { listSavedIdeas } from "./saved-ideas";
import type { MemberDashboardCounts, MemberDashboardData } from "./types";
import { listWatchlistItems } from "./watchlist";

async function getMemberContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to load member dashboard data.");
  }

  return {
    supabase,
    userId: user.id,
  };
}

function sortByUpdatedAt(previews: IdeaPreview[]) {
  return [...previews].sort((a, b) => {
    const aTime = Date.parse(a.last_lifecycle_event_at ?? a.updated_at ?? "");
    const bTime = Date.parse(b.last_lifecycle_event_at ?? b.updated_at ?? "");

    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function uniquePreviews(previews: IdeaPreview[]) {
  const seen = new Set<string>();

  return previews.filter((preview) => {
    if (seen.has(preview.id)) {
      return false;
    }

    seen.add(preview.id);
    return true;
  });
}

async function getPreviewPool() {
  return getIdeaPreviews({
    limit: 100,
    sort: "updated",
  });
}

export async function getSavedIdeaCards(limit = 6) {
  const [savedIdeas, previews] = await Promise.all([
    listSavedIdeas(),
    getPreviewPool(),
  ]);
  const savedIdeaIds = new Set(savedIdeas.map((saved) => saved.idea_id));

  return sortByUpdatedAt(
    previews.filter((preview) => savedIdeaIds.has(preview.id))
  ).slice(0, limit);
}

export async function getFollowedTickerIdeaCards(limit = 6) {
  const [followedTickers, previews] = await Promise.all([
    listFollowedTickers(),
    getPreviewPool(),
  ]);
  const followedTickerSet = new Set(
    followedTickers.map((followed) => followed.ticker.toUpperCase())
  );

  return sortByUpdatedAt(
    previews.filter((preview) =>
      followedTickerSet.has(preview.ticker.toUpperCase())
    )
  ).slice(0, limit);
}

export async function getRecentlyUpdatedMemberIdeas(limit = 6) {
  const [savedCards, followedTickerCards] = await Promise.all([
    getSavedIdeaCards(100),
    getFollowedTickerIdeaCards(100),
  ]);

  return sortByUpdatedAt(uniquePreviews([...savedCards, ...followedTickerCards]))
    .slice(0, limit);
}

export async function getClosedReviewCards(limit = 6) {
  return getIdeaPreviews({
    limit,
    sort: "closed",
    withClosedReviews: true,
  });
}

export async function getLockedPreviewCards(limit = 6) {
  const previews = await getIdeaPreviews({
    limit: 100,
    sort: "updated",
  });

  return previews.filter((preview) => preview.is_locked).slice(0, limit);
}

export async function getMemberDashboardCounts(): Promise<MemberDashboardCounts> {
  const { supabase, userId } = await getMemberContext();
  const [
    savedIdeasResult,
    followedTickersResult,
    memberNotesResult,
    closedReviewCards,
    lockedPreviewCards,
  ] = await Promise.all([
    supabase
      .from("saved_ideas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("followed_tickers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("member_idea_notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    getClosedReviewCards(100),
    getLockedPreviewCards(100),
  ]);

  if (savedIdeasResult.error) {
    throw new Error("Unable to count saved ideas.");
  }

  if (followedTickersResult.error) {
    throw new Error("Unable to count followed tickers.");
  }

  if (memberNotesResult.error) {
    throw new Error("Unable to count member notes.");
  }

  return {
    closedReviews: closedReviewCards.length,
    followedTickers: followedTickersResult.count ?? 0,
    lockedPreviews: lockedPreviewCards.length,
    memberNotes: memberNotesResult.count ?? 0,
    savedIdeas: savedIdeasResult.count ?? 0,
  };
}

export async function getMemberDashboardData(): Promise<MemberDashboardData> {
  const [
    preferences,
    savedIdeas,
    followedTickers,
    watchlistItems,
    savedIdeaCards,
    followedTickerIdeaCards,
    recentlyUpdatedIdeas,
    closedReviewCards,
    lockedPreviewCards,
    counts,
  ] = await Promise.all([
    ensureMemberPreferences(),
    listSavedIdeas(),
    listFollowedTickers(),
    listWatchlistItems(),
    getSavedIdeaCards(),
    getFollowedTickerIdeaCards(),
    getRecentlyUpdatedMemberIdeas(),
    getClosedReviewCards(),
    getLockedPreviewCards(),
    getMemberDashboardCounts(),
  ]);

  return {
    closedReviewCards,
    counts,
    followedTickerIdeaCards,
    followedTickers,
    lockedPreviewCards,
    preferences,
    recentlyUpdatedIdeas,
    savedIdeaCards,
    savedIdeas,
    watchlistItems,
  };
}
