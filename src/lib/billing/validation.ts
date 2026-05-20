import type { BillingInterval, CheckoutPlan } from "./types";

const VALID_CHECKOUT_PLANS = new Set<CheckoutPlan>(["premium", "pro"]);
const VALID_BILLING_INTERVALS = new Set<BillingInterval>([
  "monthly",
  "annual",
]);

export function validateCheckoutPlan(value: unknown): CheckoutPlan {
  if (typeof value === "string" && VALID_CHECKOUT_PLANS.has(value as CheckoutPlan)) {
    return value as CheckoutPlan;
  }

  throw new Error("Choose a valid subscription plan.");
}

export function validateBillingInterval(value: unknown): BillingInterval {
  if (
    typeof value === "string" &&
    VALID_BILLING_INTERVALS.has(value as BillingInterval)
  ) {
    return value as BillingInterval;
  }

  throw new Error("Choose a valid billing interval.");
}

export function validateStripePriceId(value: unknown) {
  if (
    typeof value === "string" &&
    /^price_[A-Za-z0-9_]+$/.test(value.trim())
  ) {
    return value.trim();
  }

  throw new Error("Stripe price ID is missing or invalid.");
}

export function validateInternalReturnPath(value: unknown, fallback = "/account") {
  if (typeof value !== "string") {
    return fallback;
  }

  const path = value.trim();

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("\n") ||
    path.includes("\r")
  ) {
    return fallback;
  }

  return path;
}
