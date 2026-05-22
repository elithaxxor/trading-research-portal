"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateNotificationPreferencesForCurrentUser } from "@/lib/email/preferences";
import type { UpdateNotificationPreferencesInput } from "@/lib/email/types";

function getFormBoolean(formData: FormData, key: string) {
  const value = formData.get(key);

  return value === "on" || value === "true" || value === "1";
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getDigestDay(formData: FormData) {
  const value = Number.parseInt(getFormString(formData, "digest_day_of_week"), 10);

  if (!Number.isInteger(value) || value < 0 || value > 6) {
    throw new Error("Choose a valid digest day.");
  }

  return value;
}

function getDigestTime(formData: FormData) {
  const value = getFormString(formData, "digest_time_utc");

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) {
    throw new Error("Choose a valid digest time.");
  }

  return value.length === 5 ? `${value}:00` : value;
}

function getPreferencePayload(formData: FormData): UpdateNotificationPreferencesInput {
  return {
    billing_account_updates: getFormBoolean(formData, "billing_account_updates"),
    closed_reviews: getFormBoolean(formData, "closed_reviews"),
    content_idea_updates: getFormBoolean(formData, "content_idea_updates"),
    content_new_ideas: getFormBoolean(formData, "content_new_ideas"),
    digest_day_of_week: getDigestDay(formData),
    digest_time_utc: getDigestTime(formData),
    email_enabled: getFormBoolean(formData, "email_enabled"),
    lifecycle_updates: getFormBoolean(formData, "lifecycle_updates"),
    software_access_updates: getFormBoolean(formData, "software_access_updates"),
    weekly_digest: getFormBoolean(formData, "weekly_digest"),
  };
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  try {
    await updateNotificationPreferencesForCurrentUser(
      getPreferencePayload(formData)
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("sign in")
    ) {
      redirect("/login?redirectedFrom=%2Faccount%2Fnotifications");
    }

    throw error;
  }

  revalidatePath("/account/notifications");
  redirect("/account/notifications?notice=notification-preferences-saved");
}
