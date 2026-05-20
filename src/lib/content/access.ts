import "server-only";

import type { User } from "@supabase/supabase-js";

import { getEffectiveSubscriptionTier } from "@/lib/billing/tiers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  AppRole,
  ContentVisibility,
  ProfileDetail,
  SubscriptionDetail,
  SubscriptionTier,
} from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<ProfileDetail | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getCurrentSubscription(): Promise<SubscriptionDetail | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getCurrentTier(): Promise<SubscriptionTier> {
  const [profile, subscription] = await Promise.all([
    getCurrentProfile(),
    getCurrentSubscription(),
  ]);

  if (profile?.role === "admin") {
    return "pro";
  }

  return getEffectiveSubscriptionTier(
    subscription?.tier,
    subscription?.status,
    false
  );
}

export function canAccessVisibility(
  requiredVisibility: ContentVisibility,
  tier: SubscriptionTier,
  role?: AppRole | null
) {
  if (requiredVisibility === "free") {
    return true;
  }

  if (role === "admin") {
    return true;
  }

  if (requiredVisibility === "premium") {
    return tier === "premium" || tier === "pro";
  }

  return tier === "pro";
}

export function sanitizeInternalPath(
  path: string | null | undefined,
  fallback = "/"
) {
  if (!path) {
    return fallback;
  }

  const trimmedPath = path.trim();

  if (
    !trimmedPath.startsWith("/") ||
    trimmedPath.startsWith("//") ||
    /^[a-z][a-z\d+\-.]*:/i.test(trimmedPath)
  ) {
    return fallback;
  }

  try {
    const decodedPath = decodeURIComponent(trimmedPath);

    if (
      decodedPath.startsWith("//") ||
      /^[a-z][a-z\d+\-.]*:/i.test(decodedPath)
    ) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmedPath;
}

export async function isAdminUser() {
  const profile = await getCurrentProfile();

  return profile?.role === "admin";
}
