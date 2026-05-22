import "server-only";

import type Stripe from "stripe";

import { queueBillingAccessStatusEmailIfChanged } from "@/lib/email/billing-notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getTierForPriceId } from "./config";
import {
  getEffectiveSubscriptionTier,
  isPaidTier,
  isSubscriptionAccessActive,
} from "./tiers";
import type {
  BillingSubscriptionRow,
  BillingSupabaseClient,
  SubscriptionAccessState,
  SubscriptionEventInput,
  SubscriptionStatus,
} from "./types";

function asBillingClient(client: unknown): BillingSupabaseClient {
  return client as BillingSupabaseClient;
}

function toIsoFromSeconds(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getObjectId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

async function findUserIdForStripeSubscription(
  admin: BillingSupabaseClient,
  subscription: Stripe.Subscription,
  customerId: string
) {
  const metadataUserId =
    subscription.metadata.supabase_user_id || subscription.metadata.user_id;

  if (metadataUserId) {
    return metadataUserId;
  }

  const { data: customerMapping, error: mappingError } = await admin
    .from<{ user_id: string }>("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (mappingError) {
    throw new Error("Unable to load Stripe customer mapping.");
  }

  if (customerMapping?.user_id) {
    return customerMapping.user_id;
  }

  const { data: existingSubscription, error: subscriptionError } = await admin
    .from<{ user_id: string }>("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error("Unable to load existing Stripe subscription mapping.");
  }

  return existingSubscription?.user_id ?? null;
}

function getExpandedInvoicePaymentIntentId(
  latestInvoice: Stripe.Subscription["latest_invoice"]
) {
  if (!latestInvoice || typeof latestInvoice === "string") {
    return null;
  }

  const invoice = latestInvoice as {
    payment_intent?: string | { id: string } | null;
  };

  return getObjectId(invoice.payment_intent);
}

function getDefaultAccessState(
  subscription: BillingSubscriptionRow | null
): SubscriptionAccessState {
  const status = subscription?.status ?? "none";
  const tier = getEffectiveSubscriptionTier(subscription?.tier, status);
  const isActive = isSubscriptionAccessActive(status);
  const isPaid = isActive && isPaidTier(tier);

  return {
    canAccessPremium: isPaid && (tier === "premium" || tier === "pro"),
    canAccessPro: isPaid && tier === "pro",
    currentPeriodEnd: subscription?.current_period_end ?? null,
    isActive,
    isPaid,
    status,
    subscription,
    tier,
  };
}

export async function getCurrentUserSubscription() {
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
    throw new Error("Unable to load current subscription.");
  }

  return (data ?? null) as BillingSubscriptionRow | null;
}

export async function getSubscriptionAccessState() {
  const subscription = await getCurrentUserSubscription();

  return getDefaultAccessState(subscription);
}

export function mapStripeStatusToSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status | string | null | undefined
): SubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return stripeStatus;
    case "paused":
      return "past_due";
    default:
      return "none";
  }
}

export async function recordSubscriptionEvent(input: SubscriptionEventInput) {
  const admin = asBillingClient(createSupabaseAdminClient());
  const { error } = await admin.from("subscription_events").insert({
    event_type: input.eventType,
    new_status: input.newStatus ?? null,
    new_tier: input.newTier ?? null,
    note: input.note ?? null,
    previous_status: input.previousStatus ?? null,
    previous_tier: input.previousTier ?? null,
    price_id: input.priceId ?? null,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_event_id: input.sourceEventId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    user_id: input.userId ?? null,
  });

  if (error) {
    throw new Error("Unable to record subscription event.");
  }
}

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  sourceEventId?: string | null
) {
  const admin = asBillingClient(createSupabaseAdminClient());
  const customerId = getObjectId(subscription.customer);

  if (!customerId) {
    throw new Error("Stripe subscription is missing a customer ID.");
  }

  const userId = await findUserIdForStripeSubscription(
    admin,
    subscription,
    customerId
  );

  if (!userId) {
    throw new Error("No Supabase user is mapped to this Stripe customer.");
  }

  const firstItem = subscription.items.data[0] ?? null;
  const price = firstItem?.price ?? null;
  const priceId = price?.id ?? null;
  const newStatus = mapStripeStatusToSubscriptionStatus(subscription.status);
  const mappedTier = getTierForPriceId(priceId);
  const hasUnknownPaidPrice = Boolean(priceId && !mappedTier);
  const newTier =
    newStatus === "canceled" || newStatus === "none"
      ? "free"
      : (mappedTier ?? "free");

  if (hasUnknownPaidPrice) {
    console.error(
      `Stripe subscription ${subscription.id} used an unknown price ID; syncing as free.`
    );
  }

  const { data: previousSubscription, error: previousError } = await admin
    .from<BillingSubscriptionRow>("subscriptions")
    .select("tier,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (previousError) {
    throw new Error("Unable to load existing subscription state.");
  }

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: toIsoFromSeconds(subscription.canceled_at),
      current_period_end: toIsoFromSeconds(firstItem?.current_period_end),
      current_period_start: toIsoFromSeconds(firstItem?.current_period_start),
      ended_at: toIsoFromSeconds(subscription.ended_at),
      last_synced_at: new Date().toISOString(),
      last_webhook_event_id: sourceEventId ?? null,
      price_id: priceId,
      status: newStatus,
      stripe_customer_id: customerId,
      stripe_latest_invoice_id: getObjectId(subscription.latest_invoice),
      stripe_payment_intent_id: getExpandedInvoicePaymentIntentId(
        subscription.latest_invoice
      ),
      stripe_product_id: getObjectId(price?.product),
      stripe_subscription_id: subscription.id,
      tier: newTier,
      trial_end: toIsoFromSeconds(subscription.trial_end),
      trial_start: toIsoFromSeconds(subscription.trial_start),
      user_id: userId,
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    throw new Error("Unable to sync Stripe subscription.");
  }

  await recordSubscriptionEvent({
    eventType: "stripe.subscription_synced",
    newStatus,
    newTier,
    note: hasUnknownPaidPrice
      ? "Unknown Stripe price ID; paid access was not granted."
      : null,
    previousStatus: previousSubscription?.status ?? null,
    previousTier: previousSubscription?.tier ?? null,
    priceId,
    sourceEventId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    userId,
  });

  await queueBillingAccessStatusEmailIfChanged({
    newStatus,
    newTier,
    previousStatus: previousSubscription?.status ?? null,
    previousTier: previousSubscription?.tier ?? null,
    sourceEventId,
    userId,
  });

  return {
    status: newStatus,
    tier: newTier,
    userId,
  };
}

export async function setUserToFree(userId: string, reason: string) {
  const admin = asBillingClient(createSupabaseAdminClient());
  const { data: previousSubscription, error: previousError } = await admin
    .from<BillingSubscriptionRow>("subscriptions")
    .select("tier,status,stripe_customer_id,stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (previousError) {
    throw new Error("Unable to load existing subscription state.");
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      cancel_at_period_end: false,
      last_synced_at: new Date().toISOString(),
      price_id: null,
      status: "none",
      tier: "free",
      user_id: userId,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error("Unable to reset user subscription to free.");
  }

  await recordSubscriptionEvent({
    eventType: "subscription.set_free",
    newStatus: "none",
    newTier: "free",
    note: reason,
    previousStatus: previousSubscription?.status ?? null,
    previousTier: previousSubscription?.tier ?? null,
    stripeCustomerId: previousSubscription?.stripe_customer_id ?? null,
    stripeSubscriptionId: previousSubscription?.stripe_subscription_id ?? null,
    userId,
  });
}
