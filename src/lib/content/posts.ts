import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import type {
  ContentListParams,
  PostDetail,
  PostPageData,
  PostPreview,
} from "./types";

type PostPreviewArgs =
  Database["public"]["Functions"]["get_post_previews"]["Args"];

function buildPostPreviewArgs(params: ContentListParams = {}) {
  const args: PostPreviewArgs = {};

  if (params.search) {
    args.p_search = params.search;
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

  return args;
}

function normalizeSlug(slug: string) {
  return slug.trim();
}

function throwContentError(context: string): never {
  throw new Error(`Unable to load ${context}.`);
}

export async function getPostPreviews(
  params: ContentListParams = {}
): Promise<PostPreview[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "get_post_previews",
    buildPostPreviewArgs(params)
  );

  if (error) {
    throwContentError("research post previews");
  }

  return data ?? [];
}

export async function getPostPreviewBySlug(
  slug: string
): Promise<PostPreview | null> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_post_preview_by_slug", {
    p_slug: normalizedSlug,
  });

  if (error) {
    throwContentError("research post preview");
  }

  return data?.[0] ?? null;
}

export async function getFullPostBySlug(
  slug: string
): Promise<PostDetail | null> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throwContentError("research post");
  }

  return data;
}

export async function getPostPageData(slug: string): Promise<PostPageData> {
  const post = await getFullPostBySlug(slug);

  if (post) {
    return {
      kind: "full",
      post,
    };
  }

  const preview = await getPostPreviewBySlug(slug);

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
