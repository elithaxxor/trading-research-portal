import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  AdminIdea,
  AdminListParams,
  AdminListResult,
  CreateAdminIdeaInput,
  UpdateAdminIdeaInput,
} from "./types";
import { getAdminListRange, normalizeAdminSearch } from "./types";

function throwAdminIdeasError(action: string): never {
  throw new Error(`Unable to ${action} trading idea.`);
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throwAdminIdeasError("identify admin user for");
  }

  return user.id;
}

export async function listAdminIdeas(
  params: AdminListParams = {}
): Promise<AdminListResult<AdminIdea>> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = getAdminListRange(params);
  const search = normalizeAdminSearch(params.search);

  let query = supabase
    .from("trading_ideas")
    .select("*", { count: "exact" });

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `title.ilike.${pattern},slug.ilike.${pattern},ticker.ilike.${pattern},setup_type.ilike.${pattern}`
    );
  }

  if (params.assetClass) {
    query = query.eq("asset_class", params.assetClass);
  }

  if (params.status) {
    query = query.eq("status", params.status);
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
    throwAdminIdeasError("list");
  }

  return {
    count,
    items: data ?? [],
  };
}

export async function getAdminIdeaById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trading_ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throwAdminIdeasError("load");
  }

  return data;
}

export async function getAdminIdeaBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trading_ideas")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throwAdminIdeasError("load");
  }

  return data;
}

export async function createAdminIdea(input: CreateAdminIdeaInput) {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId();
  const payload = {
    ...input,
    created_by: userId,
    published_at:
      input.published && !input.published_at
        ? new Date().toISOString()
        : input.published_at,
  };

  const { data, error } = await supabase
    .from("trading_ideas")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throwAdminIdeasError("create");
  }

  return data;
}

export async function updateAdminIdea(
  id: string,
  input: UpdateAdminIdeaInput
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trading_ideas")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throwAdminIdeasError("update");
  }

  return data;
}

export async function deleteAdminIdea(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("trading_ideas").delete().eq("id", id);

  if (error) {
    throwAdminIdeasError("delete");
  }
}

export async function publishAdminIdea(id: string) {
  return updateAdminIdea(id, {
    published: true,
    published_at: new Date().toISOString(),
  });
}

export async function unpublishAdminIdea(id: string) {
  return updateAdminIdea(id, {
    published: false,
    published_at: null,
  });
}
