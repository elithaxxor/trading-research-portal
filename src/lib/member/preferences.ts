import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MemberPreferencesInput } from "./types";
import { validateDashboardPreferences } from "./validation";

async function getMemberContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage dashboard preferences.");
  }

  return {
    supabase,
    userId: user.id,
  };
}

export async function getMemberPreferences() {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("member_dashboard_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load member dashboard preferences.");
  }

  return data;
}

export async function ensureMemberPreferences() {
  const { supabase, userId } = await getMemberContext();
  const { data: existingPreferences, error: loadError } = await supabase
    .from("member_dashboard_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (loadError) {
    throw new Error("Unable to load member dashboard preferences.");
  }

  if (existingPreferences) {
    return existingPreferences;
  }

  const { data, error } = await supabase
    .from("member_dashboard_preferences")
    .insert(
      {
        user_id: userId,
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to prepare member dashboard preferences.");
  }

  return data;
}

export async function updateMemberPreferences(input: MemberPreferencesInput) {
  const { supabase, userId } = await getMemberContext();
  const payload = validateDashboardPreferences(input);
  const { data, error } = await supabase
    .from("member_dashboard_preferences")
    .upsert(
      {
        ...payload,
        user_id: userId,
      },
      {
        onConflict: "user_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update member dashboard preferences.");
  }

  return data;
}
