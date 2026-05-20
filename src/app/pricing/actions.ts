"use server";

import { redirect } from "next/navigation";

import { getPriceIdForPlan } from "@/lib/billing/config";
import { getOrCreateStripeCustomerForUser } from "@/lib/billing/customers";
import { getSubscriptionAccessState } from "@/lib/billing/subscriptions";
import { getStripeClient } from "@/lib/billing/stripe";
import type { BillingSupabaseClient } from "@/lib/billing/types";
import {
  getCheckoutCancelUrl,
  getCheckoutSuccessUrl,
} from "@/lib/billing/urls";
import {
  validateBillingInterval,
  validateCheckoutPlan,
  validateInternalReturnPath,
} from "@/lib/billing/validation";
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
  return error instanceof Error ? error.message : "Unknown checkout error.";
}

function logCheckoutFailure(stage: string, error: unknown) {
  console.error(
    `[billing] Checkout failed at ${stage}: ${getCheckoutErrorMessage(error)}`
  );
}

export async function createCheckoutSessionAction(formData: FormData) {
  const tier = validateCheckoutPlan(getFormString(formData, "tier"));
  const interval = validateBillingInterval(getFormString(formData, "interval"));
  const returnPath = validateInternalReturnPath(
    getFormString(formData, "returnPath") ||
      getFormString(formData, "return_path"),
    "/account"
  );

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/login?redirectedFrom=${encodeURIComponent("/pricing")}`);
  }

  const subscriptionAccess = await getSubscriptionAccessState();

  if (subscriptionAccess.isPaid) {
    redirect("/account?billing=already_active");
  }

  let priceId: string;
  try {
    priceId = getPriceIdForPlan(tier, interval);
  } catch (error) {
    logCheckoutFailure("price_mapping", error);
    redirect("/pricing?billing=checkout_unavailable");
  }

  let stripeCustomerId: string;
  try {
    stripeCustomerId = await getOrCreateStripeCustomerForUser(user);
  } catch (error) {
    logCheckoutFailure("customer_create", error);
    redirect("/pricing?billing=checkout_unavailable");
  }

  const successUrl = await getCheckoutSuccessUrl(returnPath);
  const cancelUrl = await getCheckoutCancelUrl("/pricing");
  let stripe = null;

  try {
    stripe = getStripeClient();
  } catch (error) {
    logCheckoutFailure("stripe_client", error);
    redirect("/pricing?billing=checkout_unavailable");
  }

  let checkoutSession;

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
    logCheckoutFailure("checkout_session_create", error);
    redirect("/pricing?billing=checkout_unavailable");
  }

  if (!checkoutSession.url) {
    logCheckoutFailure(
      "checkout_session_create",
      new Error("Stripe Checkout did not return a redirect URL.")
    );
    redirect("/pricing?billing=checkout_unavailable");
  }

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
    logCheckoutFailure("checkout_session_audit", auditError);
    redirect("/pricing?billing=checkout_unavailable");
  }

  redirect(checkoutSession.url);
}
