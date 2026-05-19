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
    throw new Error("You must be signed in to manage idea notes.");
  }

  return {
    supabase,
    userId: user.id,
  };
}

export async function getMemberIdeaNote(ideaId: string) {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("member_idea_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load member idea note.");
  }

  return data;
}

export async function upsertMemberIdeaNote(ideaId: string, note: string) {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("member_idea_notes")
    .upsert(
      {
        idea_id: ideaId,
        note: validateMemberNote(note, { required: true }) ?? "",
        user_id: userId,
      },
      {
        onConflict: "user_id,idea_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to save member idea note.");
  }

  return data;
}

export async function deleteMemberIdeaNote(ideaId: string) {
  const { supabase, userId } = await getMemberContext();
  const { error } = await supabase
    .from("member_idea_notes")
    .delete()
    .eq("user_id", userId)
    .eq("idea_id", ideaId);

  if (error) {
    throw new Error("Unable to delete member idea note.");
  }
}
