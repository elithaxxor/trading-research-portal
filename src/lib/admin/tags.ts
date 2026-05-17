import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  CreateAdminTagInput,
  UpdateAdminTagInput,
  AdminTagWithUsage,
} from "./types";

function throwAdminTagsError(action: string): never {
  throw new Error(`Unable to ${action} tag.`);
}

export async function listTags() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throwAdminTagsError("list");
  }

  return data ?? [];
}

export async function listTagsWithUsage(): Promise<AdminTagWithUsage[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data: tags, error: tagsError }, { data: ideaTags, error: usageError }] =
    await Promise.all([
      supabase.from("tags").select("*").order("name", { ascending: true }),
      supabase.from("idea_tags").select("tag_id"),
    ]);

  if (tagsError || usageError) {
    throwAdminTagsError("list");
  }

  const usageCounts = new Map<string, number>();

  for (const ideaTag of ideaTags ?? []) {
    usageCounts.set(
      ideaTag.tag_id,
      (usageCounts.get(ideaTag.tag_id) ?? 0) + 1
    );
  }

  return (tags ?? []).map((tag) => ({
    ...tag,
    ideaCount: usageCounts.get(tag.id) ?? 0,
  }));
}

export async function getAdminTagById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throwAdminTagsError("load");
  }

  return data;
}

export async function getAdminTagBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throwAdminTagsError("load");
  }

  return data;
}

export async function getTagUsageCount(id: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("idea_tags")
    .select("idea_id", { count: "exact", head: true })
    .eq("tag_id", id);

  if (error) {
    throwAdminTagsError("check usage for");
  }

  return count ?? 0;
}

export async function createTag(input: CreateAdminTagInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throwAdminTagsError("create");
  }

  return data;
}

export async function updateTag(id: string, input: UpdateAdminTagInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throwAdminTagsError("update");
  }

  return data;
}

export async function deleteTag(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    throwAdminTagsError("delete");
  }
}

export async function listIdeaTags(ideaId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("idea_tags")
    .select("*")
    .eq("idea_id", ideaId);

  if (error) {
    throwAdminTagsError("list idea");
  }

  return data ?? [];
}

export async function setIdeaTags(ideaId: string, tagIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const uniqueTagIds = [...new Set(tagIds.filter(Boolean))];
  const { error: deleteError } = await supabase
    .from("idea_tags")
    .delete()
    .eq("idea_id", ideaId);

  if (deleteError) {
    throwAdminTagsError("clear idea");
  }

  if (uniqueTagIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("idea_tags")
    .insert(uniqueTagIds.map((tagId) => ({ idea_id: ideaId, tag_id: tagId })))
    .select("*");

  if (error) {
    throwAdminTagsError("set idea");
  }

  return data ?? [];
}
