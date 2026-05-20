import type Stripe from "stripe";

import type { Database } from "@/types/database.types";

export type BillingInterval = "monthly" | "annual";
export type CheckoutPlan = "premium" | "pro";

export type SubscriptionTier =
  Database["public"]["Enums"]["subscription_tier"];
export type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];

export type BillingSubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"] & {
    canceled_at?: string | null;
    ended_at?: string | null;
    last_synced_at?: string | null;
    last_webhook_event_id?: string | null;
    stripe_latest_invoice_id?: string | null;
    stripe_payment_intent_id?: string | null;
    stripe_product_id?: string | null;
    trial_end?: string | null;
    trial_start?: string | null;
  };

export type SubscriptionAccessState = {
  canAccessPremium: boolean;
  canAccessPro: boolean;
  currentPeriodEnd: string | null;
  isActive: boolean;
  isPaid: boolean;
  status: SubscriptionStatus;
  subscription: BillingSubscriptionRow | null;
  tier: SubscriptionTier;
};

export type StripeSubscriptionSyncPayload = {
  sourceEventId?: string | null;
  subscription: Stripe.Subscription;
};

export type StripeCheckoutRequest = {
  interval: BillingInterval;
  plan: CheckoutPlan;
  returnPath?: string;
};

export type StripePortalRequest = {
  returnPath?: string;
};

export type SubscriptionEventInput = {
  eventType: string;
  newStatus?: SubscriptionStatus | null;
  newTier?: SubscriptionTier | null;
  note?: string | null;
  previousStatus?: SubscriptionStatus | null;
  previousTier?: SubscriptionTier | null;
  priceId?: string | null;
  sourceEventId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  userId?: string | null;
};

export type StripeCustomerMapping = {
  email: string | null;
  stripe_customer_id: string;
  user_id: string;
};

export type BillingTableError = {
  message: string;
};

export type BillingQueryResult<T> = PromiseLike<{
  data: T | null;
  error: BillingTableError | null;
}>;

export type BillingQueryBuilder<T> = PromiseLike<{
  data: T | null;
  error: BillingTableError | null;
}> & {
  eq(column: string, value: unknown): BillingQueryBuilder<T>;
  insert(values: unknown): BillingQueryBuilder<T>;
  maybeSingle(): BillingQueryResult<T>;
  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ): BillingQueryBuilder<T>;
  select(columns?: string): BillingQueryBuilder<T>;
  single(): BillingQueryResult<T>;
  update(values: unknown): BillingQueryBuilder<T>;
  upsert(values: unknown, options?: unknown): BillingQueryBuilder<T>;
};

export type BillingSupabaseClient = {
  from<T>(table: string): BillingQueryBuilder<T>;
};
