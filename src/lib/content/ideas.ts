import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import type {
  ContentListParams,
  IdeaFullContent,
  IdeaPageData,
  IdeaPreview,
} from "./types";

type IdeaPreviewArgs =
  Database["public"]["Functions"]["get_trading_idea_previews"]["Args"];

function buildIdeaPreviewArgs(params: ContentListParams = {}) {
  const args: IdeaPreviewArgs = {};

  if (params.search) {
    args.p_search = params.search;
  }

  if (params.assetClass) {
    args.p_asset_class = params.assetClass;
  }

  if (params.status) {
    args.p_status = params.status;
  }

  if (params.visibility) {
    args.p_visibility = params.visibility;
  }

  if (params.limit !== undefined) {
    args.p_limit = params.limit;
  }

  if (params.offset !== undefined) {
    args.p_offset = params.offset;
  }

  if (params.sort) {
    args.p_sort = params.sort;
  }

  if (params.outcome) {
    args.p_outcome = params.outcome;
  }

  if (params.updatedRecently !== undefined) {
    args.p_updated_recently = params.updatedRecently;
  }

  if (params.withClosedReviews !== undefined) {
    args.p_closed_reviews = params.withClosedReviews;
  }

  return args;
}

function normalizeSlug(slug: string) {
  return slug.trim();
}

function throwContentError(context: string): never {
  throw new Error(`Unable to load ${context}.`);
}

export async function getIdeaPreviews(
  params: ContentListParams = {}
): Promise<IdeaPreview[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "get_trading_idea_previews",
    buildIdeaPreviewArgs(params)
  );

  if (error) {
    throwContentError("trading idea previews");
  }

  return data ?? [];
}

export async function getIdeaPreviewBySlug(
  slug: string
): Promise<IdeaPreview | null> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "get_trading_idea_preview_by_slug",
    {
      p_slug: normalizedSlug,
    }
  );

  if (error) {
    throwContentError("trading idea preview");
  }

  return data?.[0] ?? null;
}

export async function getFullIdeaBySlug(
  slug: string
): Promise<IdeaFullContent | null> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: idea, error: ideaError } = await supabase
    .from("trading_ideas")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("published", true)
    .maybeSingle();

  if (ideaError) {
    throwContentError("trading idea");
  }

  if (!idea) {
    return null;
  }

  const [updatesResult, chartsResult] = await Promise.all([
    supabase
      .from("idea_updates")
      .select("*")
      .eq("idea_id", idea.id)
      .order("event_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("idea_charts")
      .select("*")
      .eq("idea_id", idea.id)
      .order("created_at", { ascending: true }),
  ]);

  if (updatesResult.error) {
    throwContentError("trading idea updates");
  }

  if (chartsResult.error) {
    throwContentError("trading idea charts");
  }

  return {
    charts: chartsResult.data ?? [],
    idea,
    updates: updatesResult.data ?? [],
  };
}

export async function getIdeaPageData(slug: string): Promise<IdeaPageData> {
  const fullContent = await getFullIdeaBySlug(slug);

  if (fullContent) {
    return {
      kind: "full",
      ...fullContent,
    };
  }

  const preview = await getIdeaPreviewBySlug(slug);

  if (preview?.is_locked) {
    return {
      kind: "locked",
      preview,
    };
  }

  return {
    kind: "not_found",
  };
}
