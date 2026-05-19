import "server-only";

import type { BillingInterval, CheckoutPlan } from "./types";

type StripePriceConfig = Record<CheckoutPlan, Record<BillingInterval, string>>;

function getOptionalEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function requireConfiguredPriceId(value: string, label: string) {
  if (!value) {
    throw new Error(`Missing Stripe price ID for ${label}.`);
  }

  return value;
}

export function getStripePriceConfig(): StripePriceConfig {
  return {
    premium: {
      annual: getOptionalEnv("STRIPE_PREMIUM_ANNUAL_PRICE_ID"),
      monthly: getOptionalEnv("STRIPE_PREMIUM_MONTHLY_PRICE_ID"),
    },
    pro: {
      annual: getOptionalEnv("STRIPE_PRO_ANNUAL_PRICE_ID"),
      monthly: getOptionalEnv("STRIPE_PRO_MONTHLY_PRICE_ID"),
    },
  };
}

export function getStripeWebhookSecret() {
  return getOptionalEnv("STRIPE_WEBHOOK_SECRET");
}

export function getTierForPriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }

  const config = getStripePriceConfig();

  for (const tier of Object.keys(config) as CheckoutPlan[]) {
    for (const interval of Object.keys(config[tier]) as BillingInterval[]) {
      if (config[tier][interval] && config[tier][interval] === priceId) {
        return tier;
      }
    }
  }

  return null;
}

export function getBillingIntervalForPriceId(
  priceId: string | null | undefined
) {
  if (!priceId) {
    return null;
  }

  const config = getStripePriceConfig();

  for (const tier of Object.keys(config) as CheckoutPlan[]) {
    for (const interval of Object.keys(config[tier]) as BillingInterval[]) {
      if (config[tier][interval] && config[tier][interval] === priceId) {
        return interval;
      }
    }
  }

  return null;
}

export function getPriceIdForPlan(
  tier: CheckoutPlan,
  interval: BillingInterval
) {
  const priceId = getStripePriceConfig()[tier][interval];

  return requireConfiguredPriceId(priceId, `${tier} ${interval}`);
}
