import type {
  BillingInterval,
  SubscriptionStatus,
  SubscriptionTier,
} from "./types";

import { isPaidTier, isSubscriptionAccessActive } from "./tiers";

export function formatSubscriptionStatus(
  status: SubscriptionStatus | null | undefined
) {
  if (!status || status === "none") {
    return "None";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatSubscriptionTier(
  tier: SubscriptionTier | null | undefined
) {
  if (tier === "pro") {
    return "Pro";
  }

  if (tier === "premium") {
    return "Premium";
  }

  return "Free";
}

export function formatBillingInterval(
  interval: BillingInterval | null | undefined
) {
  return interval === "annual" ? "Annual" : "Monthly";
}

export function formatBillingDate(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatSubscriptionAccessState(
  tier: SubscriptionTier | null | undefined,
  status: SubscriptionStatus | null | undefined
) {
  if (isPaidTier(tier) && isSubscriptionAccessActive(status)) {
    return "Active paid access";
  }

  if (isPaidTier(tier)) {
    return "Paid tier inactive";
  }

  return "Free access";
}
