import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getStripeClient } from "./stripe";
import type {
  BillingSupabaseClient,
  StripeCustomerMapping,
} from "./types";

function asBillingClient(client: unknown): BillingSupabaseClient {
  return client as BillingSupabaseClient;
}

export async function getStripeCustomerIdForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const billingDb = asBillingClient(supabase);
  const { data, error } = await billingDb
    .from<Pick<StripeCustomerMapping, "stripe_customer_id">>("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load Stripe customer mapping.");
  }

  return data?.stripe_customer_id ?? null;
}

export async function upsertStripeCustomerMapping(
  userId: string,
  customerId: string,
  email: string | null
) {
  // Stripe customer mappings are server-controlled billing metadata. Regular
  // users can read their own row through RLS, but writes happen in trusted
  // server code so clients cannot attach arbitrary Stripe customers.
  const admin = asBillingClient(createSupabaseAdminClient());
  const { data, error } = await admin
    .from<StripeCustomerMapping>("stripe_customers")
    .upsert(
      {
        email,
        stripe_customer_id: customerId,
        user_id: userId,
      },
      { onConflict: "user_id" }
    )
    .select("email,stripe_customer_id,user_id")
    .single();

  if (error) {
    throw new Error("Unable to save Stripe customer mapping.");
  }

  return data;
}

export async function getOrCreateStripeCustomerForUser(user: User) {
  const existingCustomerId = await getStripeCustomerIdForUser(user.id);

  if (existingCustomerId) {
    return existingCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: {
      supabase_user_id: user.id,
    },
  });

  await upsertStripeCustomerMapping(user.id, customer.id, user.email ?? null);

  return customer.id;
}
