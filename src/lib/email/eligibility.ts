import "server-only";

import { getEffectiveSubscriptionTier } from "@/lib/billing/tiers";
import { canAccessVisibility } from "@/lib/content/access";
import { canAccessSoftwareTier } from "@/lib/software/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { isEmailGroupEnabled, isGroupEnabledByPreferences } from "./preferences";
import type {
  ContentVisibility,
  EligibleEmailRecipient,
  EmailUnsubscribeGroup,
  NotificationCategory,
  NotificationPreferences,
  SoftwareProduct,
  SubscriptionStatus,
  SubscriptionTier,
  TradingIdea,
} from "./types";

type ProfileAccess = {
  email: string | null;
  role: "admin" | "user";
  status: SubscriptionStatus | null;
  tier: SubscriptionTier | null;
  userId: string;
};

export type ContentNotificationPreference =
  | "closed_reviews"
  | "content_idea_updates"
  | "content_new_ideas"
  | "lifecycle_updates";

function getGroupForCategory(
  category: NotificationCategory
): EmailUnsubscribeGroup {
  if (category === "digest") {
    return "weekly_digest";
  }

  if (category === "lifecycle") {
    return "lifecycle_updates";
  }

  if (category === "software") {
    return "software_updates";
  }

  if (category === "billing" || category === "account") {
    return "billing_account";
  }

  return "content_updates";
}

async function getProfileAccess(userId: string): Promise<ProfileAccess | null> {
  const supabase = createSupabaseAdminClient();
  const [profileResult, subscriptionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (profileResult.error || subscriptionResult.error || !profileResult.data) {
    return null;
  }

  return {
    email: profileResult.data.email,
    role: profileResult.data.role,
    status: subscriptionResult.data?.status ?? null,
    tier: subscriptionResult.data?.tier ?? null,
    userId,
  };
}

function canAccessContent(profile: ProfileAccess, visibility: ContentVisibility) {
  const effectiveTier = getEffectiveSubscriptionTier(
    profile.tier,
    profile.status,
    profile.role === "admin"
  );

  return canAccessVisibility(visibility, effectiveTier, profile.role);
}

function isSpecificContentPreferenceEnabled(
  preferences: NotificationPreferences | null,
  preference: ContentNotificationPreference
) {
  if (!preferences?.email_enabled) {
    return false;
  }

  return Boolean(preferences[preference]);
}

async function canUseEmailAddress(
  email: string,
  group: EmailUnsubscribeGroup,
  allowGroupUnsubscribe = true
) {
  if (await isEmailSuppressed(email)) {
    return false;
  }

  if (allowGroupUnsubscribe && (await hasUserUnsubscribed(email, group))) {
    return false;
  }

  return true;
}

export async function hasUserUnsubscribed(
  email: string,
  group: EmailUnsubscribeGroup
) {
  const supabase = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", normalizedEmail)
    .in("unsubscribe_group", ["all", group])
    .limit(1);

  if (error) {
    throw new Error("Unable to check unsubscribe status.");
  }

  return (data?.length ?? 0) > 0;
}

export async function isEmailSuppressed(email: string) {
  const supabase = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const [notificationResult, providerEventResult] = await Promise.all([
    supabase
      .from("email_notifications")
      .select("id")
      .eq("recipient_email", normalizedEmail)
      .in("status", ["bounced", "complained", "suppressed"])
      .limit(1),
    supabase
      .from("email_provider_events")
      .select("id")
      .eq("recipient_email", normalizedEmail)
      .in("event_type", ["bounced", "complained", "suppressed"])
      .limit(1),
  ]);

  if (notificationResult.error || providerEventResult.error) {
    throw new Error("Unable to check email suppression status.");
  }

  return (
    (notificationResult.data?.length ?? 0) > 0 ||
    (providerEventResult.data?.length ?? 0) > 0
  );
}

export async function getEligibleUsersForContentNotification(
  contentVisibility: ContentVisibility,
  category: NotificationCategory,
  preference?: ContentNotificationPreference
): Promise<EligibleEmailRecipient[]> {
  const supabase = createSupabaseAdminClient();
  const group = getGroupForCategory(category);
  const [profilesResult, subscriptionsResult, preferencesResult] =
    await Promise.all([
      supabase.from("profiles").select("id,email,role").not("email", "is", null),
      supabase.from("subscriptions").select("user_id,tier,status"),
      supabase.from("notification_preferences").select("*"),
    ]);

  if (
    profilesResult.error ||
    subscriptionsResult.error ||
    preferencesResult.error
  ) {
    throw new Error("Unable to load notification eligibility.");
  }

  const subscriptionsByUser = new Map(
    (subscriptionsResult.data ?? []).map((subscription) => [
      subscription.user_id,
      subscription,
    ])
  );
  const preferencesByUser = new Map(
    (preferencesResult.data ?? []).map((preferences) => [
      preferences.user_id,
      preferences,
    ])
  );
  const recipients: EligibleEmailRecipient[] = [];

  for (const profile of profilesResult.data ?? []) {
    if (!profile.email) {
      continue;
    }

    const subscription = subscriptionsByUser.get(profile.id);
    const access: ProfileAccess = {
      email: profile.email,
      role: profile.role,
      status: subscription?.status ?? null,
      tier: subscription?.tier ?? null,
      userId: profile.id,
    };
    const preferences =
      preferencesByUser.get(profile.id) ?? (null as NotificationPreferences | null);

    if (!canAccessContent(access, contentVisibility)) {
      continue;
    }

    const preferencesEnabled = preference
      ? isSpecificContentPreferenceEnabled(preferences, preference)
      : isGroupEnabledByPreferences(preferences, group);

    if (!preferencesEnabled) {
      continue;
    }

    if (!(await canUseEmailAddress(profile.email, group))) {
      continue;
    }

    recipients.push({ email: profile.email, userId: profile.id });
  }

  return recipients;
}

export async function canUserReceiveIdeaNotification(
  userId: string,
  idea: Pick<TradingIdea, "visibility">
) {
  const profile = await getProfileAccess(userId);

  if (!profile?.email || !canAccessContent(profile, idea.visibility)) {
    return false;
  }

  return (
    (await isEmailGroupEnabled(userId, "content_updates")) &&
    (await canUseEmailAddress(profile.email, "content_updates"))
  );
}

export async function canUserReceiveSoftwareNotification(
  userId: string,
  softwareProduct: Pick<SoftwareProduct, "access_tier">
) {
  const profile = await getProfileAccess(userId);

  if (!profile?.email) {
    return false;
  }

  const effectiveTier = getEffectiveSubscriptionTier(
    profile.tier,
    profile.status,
    profile.role === "admin"
  );

  if (
    !canAccessSoftwareTier(
      softwareProduct.access_tier,
      effectiveTier,
      profile.role === "admin"
    )
  ) {
    return false;
  }

  return (
    (await isEmailGroupEnabled(userId, "software_updates")) &&
    (await canUseEmailAddress(profile.email, "software_updates"))
  );
}

export async function canUserReceiveBillingNotification(userId: string) {
  const profile = await getProfileAccess(userId);

  if (!profile?.email) {
    return false;
  }

  return (
    (await isEmailGroupEnabled(userId, "billing_account")) &&
    (await canUseEmailAddress(profile.email, "billing_account", false))
  );
}
