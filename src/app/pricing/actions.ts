"use server";

import { redirect } from "next/navigation";

import { getPriceIdForPlan } from "@/lib/billing/config";
import {
  getOrCreateStripeCustomerForUser,
  StripeCustomerSetupError,
} from "@/lib/billing/customers";
import { getSubscriptionAccessState } from "@/lib/billing/subscriptions";
import { getStripeClient } from "@/lib/billing/stripe";
import type {
  BillingInterval,
  BillingSupabaseClient,
  CheckoutPlan,
} from "@/lib/billing/types";
import {
  getCheckoutCancelUrl,
  getCheckoutSuccessUrl,
} from "@/lib/billing/urls";
import {
  validateBillingInterval,
  validateCheckoutPlan,
  validateInternalReturnPath,
} from "@/lib/billing/validation";
import { isFeatureEnabled } from "@/lib/flags/server";
import { captureSafeException } from "@/lib/monitoring/sentry";
import { recordOpsEventSafely } from "@/lib/ops/events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function asBillingClient(client: unknown): BillingSupabaseClient {
  return client as BillingSupabaseClient;
}

function getStripeObjectId(value: string | { id: string } | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getCheckoutErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown checkout error.";

  return message
    .replace(/\b(price|cus|cs|sub|in|pi)_[A-Za-z0-9_]+/g, "$1_[redacted]")
    .replace(/\bsk_(test|live)_[A-Za-z0-9_]+/g, "sk_$1_[redacted]")
    .replace(/\bwhsec_[A-Za-z0-9_]+/g, "whsec_[redacted]")
    .replace(/\bsb_secret_[A-Za-z0-9_]+/g, "sb_secret_[redacted]");
}

function getEnvPresence() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

  return {
    stripePremiumAnnualPriceId: Boolean(
      process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID?.trim()
    ),
    stripePremiumMonthlyPriceId: Boolean(
      process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID?.trim()
    ),
    stripeProAnnualPriceId: Boolean(
      process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim()
    ),
    stripeProMonthlyPriceId: Boolean(
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim()
    ),
    stripeSecretKeyMode: stripeSecretKey.startsWith("sk_test_")
      ? "test"
      : stripeSecretKey.startsWith("sk_live_")
        ? "live"
        : stripeSecretKey
          ? "unknown"
          : "missing",
    stripeSecretKeyPresent: Boolean(stripeSecretKey),
  };
}

function getStripeErrorContext(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate =
    error instanceof StripeCustomerSetupError && error.cause
      ? error.cause
      : error;

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const stripeError = candidate as {
    code?: unknown;
    decline_code?: unknown;
    statusCode?: unknown;
    type?: unknown;
  };

  return {
    code: typeof stripeError.code === "string" ? stripeError.code : null,
    declineCode:
      typeof stripeError.decline_code === "string"
        ? stripeError.decline_code
        : null,
    statusCode:
      typeof stripeError.statusCode === "number"
        ? stripeError.statusCode
        : null,
    type: typeof stripeError.type === "string" ? stripeError.type : null,
  };
}

function logCheckoutFailure(
  stage: string,
  error: unknown,
  context: {
    interval?: BillingInterval | null;
    tier?: CheckoutPlan | null;
    userId?: string | null;
  } = {}
) {
  captureSafeException(error, {
    area: "billing",
    extra: {
      env: getEnvPresence(),
      interval: context.interval ?? null,
      stripe: getStripeErrorContext(error),
      tier: context.tier ?? null,
      user_id_present: Boolean(context.userId),
    },
    route: "/pricing",
    stage,
  });

  console.error("[billing] Checkout failed", {
    env: getEnvPresence(),
    interval: context.interval ?? null,
    message: getCheckoutErrorMessage(error),
    stage,
    stripe: getStripeErrorContext(error),
    tier: context.tier ?? null,
    userId: context.userId ?? null,
  });
}

function redirectToCheckoutSetupMessage(): never {
  redirect("/pricing?billing=checkout_unavailable");
}

function redirectToInvalidSelectionMessage(): never {
  redirect("/pricing?billing=invalid_checkout_selection");
}

export async function createCheckoutSessionAction(formData: FormData) {
  if (!isFeatureEnabled("checkout_enabled")) {
    logCheckoutFailure(
      "feature_checkout_disabled",
      new Error("Checkout is disabled by launch controls.")
    );
    redirectToCheckoutSetupMessage();
  }

  let tier: CheckoutPlan;
  let interval: BillingInterval;

  try {
    tier = validateCheckoutPlan(getFormString(formData, "tier"));
    interval = validateBillingInterval(getFormString(formData, "interval"));
  } catch (error) {
    logCheckoutFailure("checkout_input_validation", error);
    redirectToInvalidSelectionMessage();
  }

  const returnPath = validateInternalReturnPath(
    getFormString(formData, "returnPath") ||
      getFormString(formData, "return_path"),
    "/account"
  );

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    logCheckoutFailure("supabase_server_client", error, { interval, tier });
    redirectToCheckoutSetupMessage();
  }

  let userId: string | null = null;
  let user;
  let userError;

  try {
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user;
    userError = authResult.error;
  } catch (error) {
    logCheckoutFailure("auth_user_lookup", error, { interval, tier, userId });
    redirectToCheckoutSetupMessage();
  }

  if (userError || !user) {
    redirect(`/login?redirectedFrom=${encodeURIComponent("/pricing")}`);
  }

  userId = user.id;

  let subscriptionAccess;

  try {
    subscriptionAccess = await getSubscriptionAccessState();
  } catch (error) {
    logCheckoutFailure("subscription_access_lookup", error, {
      interval,
      tier,
      userId,
    });
    redirectToCheckoutSetupMessage();
  }

  if (subscriptionAccess.isPaid) {
    redirect("/account?billing=already_active");
  }

  let priceId: string;
  try {
    priceId = getPriceIdForPlan(tier, interval);
  } catch (error) {
    logCheckoutFailure("price_mapping", error, { interval, tier, userId });
    redirectToCheckoutSetupMessage();
  }

  try {
    getStripeClient();
  } catch (error) {
    logCheckoutFailure("stripe_client", error, { interval, tier, userId });
    redirectToCheckoutSetupMessage();
  }

  let stripeCustomerId: string;
  try {
    stripeCustomerId = await getOrCreateStripeCustomerForUser(user);
  } catch (error) {
    logCheckoutFailure(
      error instanceof StripeCustomerSetupError
        ? error.stage
        : "stripe_customer_create",
      error,
      { interval, tier, userId }
    );
    redirectToCheckoutSetupMessage();
  }

  let successUrl: string;
  let cancelUrl: string;

  try {
    successUrl = await getCheckoutSuccessUrl(returnPath);
    cancelUrl = await getCheckoutCancelUrl("/pricing");
  } catch (error) {
    logCheckoutFailure("checkout_url_build", error, { interval, tier, userId });
    redirectToCheckoutSetupMessage();
  }

  let checkoutSession;
  const stripe = getStripeClient();

  try {
    checkoutSession = await stripe.checkout.sessions.create({
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        billing_interval: interval,
        requested_tier: tier,
        supabase_user_id: user.id,
      },
      mode: "subscription",
      subscription_data: {
        metadata: {
          billing_interval: interval,
          requested_tier: tier,
          supabase_user_id: user.id,
        },
      },
      success_url: successUrl,
    });
  } catch (error) {
    logCheckoutFailure("checkout_session_create", error, {
      interval,
      tier,
      userId,
    });
    redirectToCheckoutSetupMessage();
  }

  if (!checkoutSession.url) {
    logCheckoutFailure(
      "checkout_session_create",
      new Error("Stripe Checkout did not return a redirect URL."),
      { interval, tier, userId }
    );
    redirectToCheckoutSetupMessage();
  }

  try {
    const billingDb = asBillingClient(createSupabaseAdminClient());
    const { error: auditError } = await billingDb
      .from("stripe_checkout_sessions")
      .insert({
        cancel_url: cancelUrl,
        mode: checkoutSession.mode ?? "subscription",
        payment_status: checkoutSession.payment_status ?? null,
        requested_price_id: priceId,
        requested_tier: tier,
        status: checkoutSession.status ?? null,
        stripe_customer_id: stripeCustomerId,
        stripe_session_id: checkoutSession.id,
        stripe_subscription_id: getStripeObjectId(checkoutSession.subscription),
        success_url: successUrl,
        user_id: user.id,
      });

    if (auditError) {
      logCheckoutFailure("checkout_session_audit", auditError, {
        interval,
        tier,
        userId,
      });
      redirectToCheckoutSetupMessage();
    }
  } catch (error) {
    logCheckoutFailure("checkout_session_audit", error, {
      interval,
      tier,
      userId,
    });
    redirectToCheckoutSetupMessage();
  }

  await recordOpsEventSafely({
    entityType: "stripe_checkout_session",
    eventName: "checkout_started",
    metadata: {
      billing_interval: interval,
      checkout_audit_recorded: true,
      mode: checkoutSession.mode ?? "subscription",
      requested_tier: tier,
    },
    route: "/pricing",
    source: "server",
    userId: user.id,
  });

  redirect(checkoutSession.url);
}
