import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { validateMemberNote } from "./validation";

async function getMemberContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage saved ideas.");
  }

  return {
    supabase,
    userId: user.id,
  };
}

export async function listSavedIdeas() {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("saved_ideas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load saved ideas.");
  }

  return data ?? [];
}

export async function isIdeaSaved(ideaId: string) {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("saved_ideas")
    .select("id")
    .eq("user_id", userId)
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to check saved idea state.");
  }

  return Boolean(data);
}

export async function getSavedIdea(ideaId: string) {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("saved_ideas")
    .select("*")
    .eq("user_id", userId)
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load saved idea.");
  }

  return data;
}

export async function saveIdea(ideaId: string, note?: string | null) {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("saved_ideas")
    .upsert(
      {
        idea_id: ideaId,
        note: validateMemberNote(note),
        user_id: userId,
      },
      {
        onConflict: "user_id,idea_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to save this idea.");
  }

  return data;
}

export async function updateSavedIdeaNote(ideaId: string, note: string | null) {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("saved_ideas")
    .update({
      note: validateMemberNote(note),
    })
    .eq("user_id", userId)
    .eq("idea_id", ideaId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update saved idea note.");
  }

  return data;
}

export async function unsaveIdea(ideaId: string) {
  const { supabase, userId } = await getMemberContext();
  const { error } = await supabase
    .from("saved_ideas")
    .delete()
    .eq("user_id", userId)
    .eq("idea_id", ideaId);

  if (error) {
    throw new Error("Unable to remove saved idea.");
  }
}
