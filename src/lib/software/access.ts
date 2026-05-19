import "server-only";

import {
  getEffectiveSubscriptionTier,
  isSubscriptionAccessActive,
} from "@/lib/billing/tiers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  SoftwareAccessTier,
  SubscriptionTier,
} from "./types";

export async function getCurrentSoftwareAccessTier() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      accountTier: "free" as const,
      billingStatus: "none" as const,
      isAccessActive: false,
      isAdmin: false,
      user: null,
      userTier: null,
    };
  }

  const [profileResult, subscriptionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw new Error("Unable to determine admin software access.");
  }

  if (subscriptionResult.error) {
    throw new Error("Unable to determine software access tier.");
  }

  const isAdmin = profileResult.data?.role === "admin";
  const accountTier = subscriptionResult.data?.tier ?? "free";
  const billingStatus = subscriptionResult.data?.status ?? "none";

  return {
    accountTier,
    billingStatus,
    isAccessActive:
      isAdmin || isSubscriptionAccessActive(subscriptionResult.data?.status),
    isAdmin,
    user,
    userTier: getEffectiveSubscriptionTier(
      subscriptionResult.data?.tier,
      subscriptionResult.data?.status,
      isAdmin
    ),
  };
}

export function canAccessSoftwareTier(
  requiredTier: SoftwareAccessTier,
  userTier: SubscriptionTier | null,
  isAdmin = false
) {
  if (isAdmin) {
    return true;
  }

  if (requiredTier === "premium_lite") {
    return userTier === "premium" || userTier === "pro";
  }

  if (requiredTier === "pro") {
    return userTier === "pro";
  }

  return false;
}

export function getSoftwareAccessLabel(
  requiredTier: SoftwareAccessTier,
  userTier: SubscriptionTier | null,
  isAdmin = false
) {
  if (isAdmin) {
    return "Admin access";
  }

  if (canAccessSoftwareTier(requiredTier, userTier, isAdmin)) {
    return requiredTier === "pro" ? "Pro software" : "Lite software";
  }

  return getSoftwareLockedReason(requiredTier, userTier, isAdmin);
}

export function getSoftwareLockedReason(
  requiredTier: SoftwareAccessTier,
  userTier: SubscriptionTier | null,
  isAdmin = false
) {
  if (isAdmin) {
    return "Admins can access all software.";
  }

  if (!userTier) {
    return "Sign in with a Premium or Pro account to access software.";
  }

  if (requiredTier === "premium_lite") {
    return "Lite software requires Premium or Pro access.";
  }

  return "Pro software requires Pro access.";
}
