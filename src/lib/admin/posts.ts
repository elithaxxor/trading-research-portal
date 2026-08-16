import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  AdminListParams,
  AdminListResult,
  AdminPost,
  CreateAdminPostInput,
  UpdateAdminPostInput,
} from "./types";
import { getAdminListRange, normalizeAdminSearch } from "./types";

function throwAdminPostsError(action: string): never {
  throw new Error(`Unable to ${action} research post.`);
}

export async function listAdminPosts(
  params: AdminListParams = {}
): Promise<AdminListResult<AdminPost>> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = getAdminListRange(params);
  const search = normalizeAdminSearch(params.search);

  let query = supabase.from("posts").select("*", { count: "exact" });

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `title.ilike.${pattern},slug.ilike.${pattern},excerpt.ilike.${pattern}`
    );
  }

  if (params.visibility) {
    query = query.eq("visibility", params.visibility);
  }

  if (params.published !== undefined) {
    query = query.eq("published", params.published);
  }

  const { count, data, error } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throwAdminPostsError("list");
  }

  return {
    count,
    items: data ?? [],
  };
}

export async function getAdminPostById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throwAdminPostsError("load");
  }

  return data;
}

export async function getAdminPostBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throwAdminPostsError("load");
  }

  return data;
}

export async function createAdminPost(
  input: CreateAdminPostInput,
  createdBy: string
) {
  const supabase = await createSupabaseServerClient();
  const payload = {
    ...input,
    created_by: createdBy,
    published_at:
      input.published && !input.published_at
        ? new Date().toISOString()
        : input.published_at,
  };

  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throwAdminPostsError("create");
  }

  return data;
}

export async function updateAdminPost(id: string, input: UpdateAdminPostInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throwAdminPostsError("update");
  }

  return data;
}

export async function deleteAdminPost(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    throwAdminPostsError("delete");
  }
}

export async function publishAdminPost(id: string) {
  return updateAdminPost(id, {
    published: true,
    published_at: new Date().toISOString(),
  });
}

export async function unpublishAdminPost(id: string) {
  return updateAdminPost(id, {
    published: false,
    published_at: null,
  });
}
