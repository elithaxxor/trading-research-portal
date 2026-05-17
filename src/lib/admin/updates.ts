import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  CreateIdeaUpdateInput,
  UpdateIdeaUpdateInput,
} from "./types";

function throwIdeaUpdatesError(action: string): never {
  throw new Error(`Unable to ${action} idea update.`);
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throwIdeaUpdatesError("identify admin user for");
  }

  return user.id;
}

export async function listIdeaUpdates(ideaId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("idea_updates")
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false });

  if (error) {
    throwIdeaUpdatesError("list");
  }

  return data ?? [];
}

export async function createIdeaUpdate(
  ideaId: string,
  input: CreateIdeaUpdateInput
) {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("idea_updates")
    .insert({
      ...input,
      created_by: userId,
      idea_id: ideaId,
    })
    .select("*")
    .single();

  if (error) {
    throwIdeaUpdatesError("create");
  }

  return data;
}

export async function updateIdeaUpdate(
  updateId: string,
  input: UpdateIdeaUpdateInput
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("idea_updates")
    .update(input)
    .eq("id", updateId)
    .select("*")
    .single();

  if (error) {
    throwIdeaUpdatesError("update");
  }

  return data;
}

export async function deleteIdeaUpdate(updateId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("idea_updates")
    .delete()
    .eq("id", updateId);

  if (error) {
    throwIdeaUpdatesError("delete");
  }
}
