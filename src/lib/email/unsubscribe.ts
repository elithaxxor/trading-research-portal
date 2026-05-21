import "server-only";

import { randomBytes } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { buildProtectedAppLink } from "./safety";
import type { EmailSendInput, EmailUnsubscribeGroup } from "./types";

function createToken() {
  return randomBytes(32).toString("base64url");
}

function getPreferenceUpdateForGroup(group: EmailUnsubscribeGroup) {
  if (group === "all") {
    return {
      closed_reviews: false,
      content_idea_updates: false,
      content_new_ideas: false,
      email_enabled: false,
      lifecycle_updates: false,
      weekly_digest: false,
    };
  }

  if (group === "content_updates") {
    return {
      content_idea_updates: false,
      content_new_ideas: false,
    };
  }

  if (group === "lifecycle_updates") {
    return {
      closed_reviews: false,
      lifecycle_updates: false,
    };
  }

  if (group === "weekly_digest") {
    return { weekly_digest: false };
  }

  if (group === "software_updates") {
    return { software_access_updates: false };
  }

  return { billing_account_updates: false };
}

export async function createUnsubscribeToken(
  userId: string | null,
  email: string,
  group: EmailUnsubscribeGroup
) {
  const supabase = createSupabaseAdminClient();
  const token = createToken();
  const { data, error } = await supabase
    .from("email_unsubscribes")
    .insert({
      email: email.trim().toLowerCase(),
      token,
      unsubscribe_group: group,
      user_id: userId,
    })
    .select("token")
    .single();

  if (error) {
    throw new Error("Unable to create unsubscribe token.");
  }

  return data.token;
}

export function getUnsubscribeUrl(token: string) {
  return buildProtectedAppLink(`/unsubscribe?token=${encodeURIComponent(token)}`);
}

export async function processUnsubscribeToken(token: string) {
  if (!token || token.length < 16) {
    throw new Error("Invalid unsubscribe token.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_unsubscribes")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to process unsubscribe token.");
  }

  if (!data) {
    return null;
  }

  if (data.user_id) {
    const preferenceUpdate = getPreferenceUpdateForGroup(data.unsubscribe_group);
    const { data: existingPreferences, error: existingPreferencesError } =
      await supabase
        .from("notification_preferences")
        .select("user_id")
        .eq("user_id", data.user_id)
        .maybeSingle();

    if (existingPreferencesError) {
      throw new Error("Unable to update unsubscribe preferences.");
    }

    if (!existingPreferences) {
      const { error: insertError } = await supabase
        .from("notification_preferences")
        .insert({
          billing_account_updates: true,
          closed_reviews: false,
          content_idea_updates: false,
          content_new_ideas: false,
          digest_day_of_week: 1,
          digest_time_utc: "14:00",
          email_enabled: true,
          lifecycle_updates: false,
          software_access_updates: true,
          weekly_digest: false,
          user_id: data.user_id,
        });

      if (insertError) {
        throw new Error("Unable to update unsubscribe preferences.");
      }
    }

    const { error: updateError } = await supabase
      .from("notification_preferences")
      .update(preferenceUpdate)
      .eq("user_id", data.user_id);

    if (updateError) {
      throw new Error("Unable to update unsubscribe preferences.");
    }
  }

  return data;
}

export function addListUnsubscribeHeaders(
  input: EmailSendInput & { unsubscribeUrl?: string | null }
) {
  if (!input.unsubscribeUrl) {
    return input;
  }

  return {
    ...input,
    headers: {
      ...input.headers,
      "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
