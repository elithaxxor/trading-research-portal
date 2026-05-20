import type { SubscriptionStatus, SubscriptionTier } from "./types";

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

export function isPaidTier(tier: SubscriptionTier | null | undefined) {
  return tier === "premium" || tier === "pro";
}

export function isSubscriptionAccessActive(
  status: SubscriptionStatus | null | undefined
) {
  return status === "active" || status === "trialing";
}

export function getEffectiveSubscriptionTier(
  tier: SubscriptionTier | null | undefined,
  status: SubscriptionStatus | null | undefined,
  isAdmin = false
): SubscriptionTier {
  if (isAdmin) {
    return "pro";
  }

  if (!isSubscriptionAccessActive(status)) {
    return "free";
  }

  return normalizeSubscriptionTier(tier);
}

export function getTierRank(tier: SubscriptionTier | null | undefined) {
  return tier ? TIER_RANK[tier] : TIER_RANK.free;
}

export function canAccessPaidTier(
  tier: SubscriptionTier | null | undefined,
  requiredTier: Exclude<SubscriptionTier, "free">
) {
  return getTierRank(tier) >= getTierRank(requiredTier);
}

export function normalizeSubscriptionTier(
  value: unknown
): SubscriptionTier {
  if (value === "premium" || value === "pro") {
    return value;
  }

  return "free";
}

export function getTierLabel(tier: SubscriptionTier | null | undefined) {
  if (tier === "pro") {
    return "Pro";
  }

  if (tier === "premium") {
    return "Premium";
  }

  return "Free";
}
