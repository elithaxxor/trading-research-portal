import "server-only";

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
      isAdmin: false,
      user: null,
      userTier: null,
    };
  }

  const [tierResult, adminResult] = await Promise.all([
    supabase.rpc("get_user_tier"),
    supabase.rpc("is_admin"),
  ]);

  if (tierResult.error) {
    throw new Error("Unable to determine software access tier.");
  }

  if (adminResult.error) {
    throw new Error("Unable to determine admin software access.");
  }

  return {
    isAdmin: Boolean(adminResult.data),
    user,
    userTier: tierResult.data,
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
