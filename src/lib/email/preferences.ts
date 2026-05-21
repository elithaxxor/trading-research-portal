import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  EmailUnsubscribeGroup,
  NotificationPreferences,
  NotificationPreferencesInsert,
  UpdateNotificationPreferencesInput,
} from "./types";

const PREFERENCE_FIELDS = [
  "billing_account_updates",
  "closed_reviews",
  "content_idea_updates",
  "content_new_ideas",
  "digest_day_of_week",
  "digest_time_utc",
  "email_enabled",
  "lifecycle_updates",
  "software_access_updates",
  "weekly_digest",
] as const;

function validatePreferencesInput(input: UpdateNotificationPreferencesInput) {
  const update: UpdateNotificationPreferencesInput = {};

  for (const field of PREFERENCE_FIELDS) {
    if (!(field in input)) {
      continue;
    }

    const value = input[field];

    if (field === "digest_day_of_week") {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 6
      ) {
        throw new Error("Choose a valid digest day.");
      }
    } else if (field === "digest_time_utc") {
      if (typeof value !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
        throw new Error("Choose a valid digest time.");
      }
    } else if (typeof value !== "boolean") {
      throw new Error("Notification preference values must be true or false.");
    }

    update[field] = value as never;
  }

  return update;
}

function getDefaultPreferences(userId: string): NotificationPreferencesInsert {
  return {
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
    user_id: userId,
  };
}

export async function getNotificationPreferences(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load notification preferences.");
  }

  return data;
}

export async function ensureNotificationPreferences(userId: string) {
  const existing = await getNotificationPreferences(userId);

  if (existing) {
    return existing;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .insert(getDefaultPreferences(userId))
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to create notification preferences.");
  }

  return data;
}

export async function updateNotificationPreferencesForCurrentUser(
  input: UpdateNotificationPreferencesInput
) {
  const update = validatePreferencesInput(input);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Sign in to update notification preferences.");
  }

  const { error: upsertError } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        ...getDefaultPreferences(user.id),
        ...update,
        user_id: user.id,
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    throw new Error("Unable to update notification preferences.");
  }

  return ensureNotificationPreferences(user.id);
}

export function isGroupEnabledByPreferences(
  preferences: NotificationPreferences | null,
  group: EmailUnsubscribeGroup
) {
  if (!preferences) {
    return false;
  }

  if (group === "all") {
    return preferences.email_enabled;
  }

  if (
    !preferences.email_enabled &&
    group !== "billing_account" &&
    group !== "software_updates"
  ) {
    return false;
  }

  if (group === "content_updates") {
    return preferences.content_new_ideas || preferences.content_idea_updates;
  }

  if (group === "lifecycle_updates") {
    return preferences.lifecycle_updates || preferences.closed_reviews;
  }

  if (group === "weekly_digest") {
    return preferences.weekly_digest;
  }

  if (group === "software_updates") {
    return preferences.software_access_updates;
  }

  return preferences.billing_account_updates;
}

export async function isEmailGroupEnabled(
  userId: string,
  group: EmailUnsubscribeGroup
) {
  const preferences = await ensureNotificationPreferences(userId);

  return isGroupEnabledByPreferences(preferences, group);
}
