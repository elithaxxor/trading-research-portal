import "server-only";

import { getIdeaPreviews } from "@/lib/content/ideas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  AddWatchlistItemInput,
  UpdateWatchlistItemInput,
  WatchlistItem,
} from "./types";
import { validateMemberNote, validateTicker } from "./validation";

async function getMemberContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage your watchlist.");
  }

  return {
    supabase,
    userId: user.id,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateWatchlistItemId(id: string) {
  if (!UUID_PATTERN.test(id)) {
    throw new Error("A valid watchlist item id is required.");
  }

  return id;
}

function validateOptionalIdeaId(ideaId: string | null | undefined) {
  const normalized = ideaId?.trim();

  if (!normalized) {
    return null;
  }

  if (!UUID_PATTERN.test(normalized)) {
    throw new Error("Linked idea must be a valid idea id.");
  }

  return normalized;
}

async function getRecentIdeasForTicker(ticker: string) {
  const previews = await getIdeaPreviews({
    limit: 12,
    search: ticker,
    sort: "updated",
  });
  const normalizedTicker = validateTicker(ticker);

  return previews
    .filter((preview) => preview.ticker.toUpperCase() === normalizedTicker)
    .slice(0, 3);
}

async function getAccessibleIdeaLink(ideaId: string | null) {
  if (!ideaId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trading_ideas")
    .select("id,slug,ticker,title")
    .eq("id", ideaId)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load linked idea.");
  }

  return data;
}

async function assertAccessibleLinkedIdea(ideaId: string | null) {
  if (!ideaId) {
    return null;
  }

  const idea = await getAccessibleIdeaLink(ideaId);

  if (!idea) {
    throw new Error("Linked idea must be published and accessible.");
  }

  return idea.id;
}

export async function listWatchlistItems(): Promise<WatchlistItem[]> {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", userId)
    .order("ticker", { ascending: true });

  if (error) {
    throw new Error("Unable to load watchlist items.");
  }

  const items = data ?? [];
  const enrichedItems = await Promise.all(
    items.map(async (item): Promise<WatchlistItem> => {
      const [linkedIdea, recentIdeas] = await Promise.all([
        getAccessibleIdeaLink(item.idea_id),
        getRecentIdeasForTicker(item.ticker),
      ]);

      return {
        created_at: item.created_at,
        id: item.id,
        linkedIdea,
        note: item.note,
        recentIdeas,
        ticker: item.ticker,
        updated_at: item.updated_at,
      };
    })
  );

  return enrichedItems;
}

export async function addWatchlistItem(input: AddWatchlistItemInput) {
  const { supabase, userId } = await getMemberContext();
  const ticker = validateTicker(input.ticker);
  const ideaId = await assertAccessibleLinkedIdea(
    validateOptionalIdeaId(input.ideaId)
  );
  const { data, error } = await supabase
    .from("watchlist_items")
    .upsert(
      {
        idea_id: ideaId,
        note: validateMemberNote(input.note),
        ticker,
        user_id: userId,
      },
      {
        onConflict: "user_id,ticker",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to add watchlist item.");
  }

  return data;
}

export async function updateWatchlistItem(
  id: string,
  input: UpdateWatchlistItemInput
) {
  const { supabase, userId } = await getMemberContext();
  const payload: {
    idea_id?: string | null;
    note?: string | null;
    ticker?: string;
  } = {};

  if (input.ticker !== undefined && input.ticker !== null) {
    payload.ticker = validateTicker(input.ticker);
  }

  if (input.note !== undefined) {
    payload.note = validateMemberNote(input.note);
  }

  if (input.ideaId !== undefined) {
    payload.idea_id = await assertAccessibleLinkedIdea(
      validateOptionalIdeaId(input.ideaId)
    );
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .update(payload)
    .eq("id", validateWatchlistItemId(id))
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update watchlist item.");
  }

  return data;
}

export async function removeWatchlistItem(id: string) {
  const { supabase, userId } = await getMemberContext();
  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", validateWatchlistItemId(id))
    .eq("user_id", userId);

  if (error) {
    throw new Error("Unable to remove watchlist item.");
  }
}
