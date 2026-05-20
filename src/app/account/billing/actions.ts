"use server";

import { redirect } from "next/navigation";

import { getStripeCustomerIdForUser } from "@/lib/billing/customers";
import { getStripeClient } from "@/lib/billing/stripe";
import { getBillingReturnUrl } from "@/lib/billing/urls";
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

  const stripeCustomerId = await getStripeCustomerIdForUser(user.id);

  if (!stripeCustomerId) {
    redirect("/pricing?billing=no_customer");
  }

  const stripe = getStripeClient();
  const returnUrl = await getBillingReturnUrl("/account");
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  redirect(portalSession.url);
}
