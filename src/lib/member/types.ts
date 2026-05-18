import type { IdeaPreview } from "@/lib/content/types";
import type { Database } from "@/types/database.types";

export type MemberTableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type MemberTableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type MemberTableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type MemberDashboardView =
  Database["public"]["Enums"]["member_dashboard_view"];
export type MemberSortPreference =
  Database["public"]["Enums"]["member_sort_preference"];

export type MemberPreferences =
  MemberTableRow<"member_dashboard_preferences">;
export type MemberPreferencesInput = Partial<
  Pick<
    MemberPreferences,
    | "default_sort"
    | "default_view"
    | "preferred_asset_classes"
    | "preferred_statuses"
    | "preferred_visibility"
    | "show_charts_on_dashboard"
    | "show_closed_reviews"
    | "show_locked_previews"
    | "show_software_section"
  >
>;

export type SavedIdea = MemberTableRow<"saved_ideas">;
export type FollowedTicker = MemberTableRow<"followed_tickers">;
export type MemberIdeaNote = MemberTableRow<"member_idea_notes">;
export type WatchlistItemRow = MemberTableRow<"watchlist_items">;

export type WatchlistItem = {
  created_at: string;
  id: string;
  linkedIdea: {
    id: string;
    slug: string;
    ticker: string;
    title: string;
  } | null;
  note: string | null;
  recentIdeas: IdeaPreview[];
  ticker: string;
  updated_at: string;
};

export type AddWatchlistItemInput = {
  ideaId?: string | null;
  note?: string | null;
  ticker: string;
};

export type UpdateWatchlistItemInput = {
  ideaId?: string | null;
  note?: string | null;
  ticker?: string | null;
};

export type MemberDashboardCounts = {
  closedReviews: number;
  followedTickers: number;
  lockedPreviews: number;
  memberNotes: number;
  savedIdeas: number;
};

export type MemberDashboardData = {
  closedReviewCards: IdeaPreview[];
  counts: MemberDashboardCounts;
  followedTickerIdeaCards: IdeaPreview[];
  followedTickers: FollowedTicker[];
  lockedPreviewCards: IdeaPreview[];
  preferences: MemberPreferences | null;
  recentlyUpdatedIdeas: IdeaPreview[];
  savedIdeaCards: IdeaPreview[];
  savedIdeas: SavedIdea[];
  watchlistItems: WatchlistItem[];
};
