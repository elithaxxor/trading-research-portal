"use server";

import { redirect } from "next/navigation";

import { getStripeCustomerIdForUser } from "@/lib/billing/customers";
import { getStripeClient } from "@/lib/billing/stripe";
import { getBillingReturnUrl } from "@/lib/billing/urls";
import { isFeatureEnabled } from "@/lib/flags/server";
import { captureSafeException } from "@/lib/monitoring/sentry";
import { recordOpsEventSafely } from "@/lib/ops/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createCustomerPortalSessionAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/login?redirectedFrom=${encodeURIComponent("/account")}`);
  }

  if (!isFeatureEnabled("customer_portal_enabled")) {
    redirect("/account/billing?billing=portal_disabled");
  }

  const stripeCustomerId = await getStripeCustomerIdForUser(user.id);

  if (!stripeCustomerId) {
    redirect("/pricing?billing=no_customer");
  }

  let portalUrl: string;

  try {
    const stripe = getStripeClient();
    const returnUrl = await getBillingReturnUrl("/account");
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    portalUrl = portalSession.url;
  } catch (error) {
    captureSafeException(error, {
      area: "billing",
      extra: {
        stripe_customer_present: Boolean(stripeCustomerId),
      },
      route: "/account/billing",
      stage: "billing_portal_session_create",
      tags: {
        user_id_present: Boolean(user.id),
      },
    });
    redirect("/account/billing?billing=portal_unavailable");
  }

  await recordOpsEventSafely({
    entityType: "stripe_customer",
    eventName: "billing_portal_opened",
    metadata: {
      return_path: "/account",
    },
    route: "/account/billing",
    source: "server",
    userId: user.id,
  });

  redirect(portalUrl);
}
