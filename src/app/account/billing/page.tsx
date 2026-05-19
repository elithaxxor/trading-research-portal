import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CreditCard, ExternalLink, ShieldCheck } from "lucide-react";

import { createCustomerPortalSessionAction } from "@/app/account/billing/actions";
import { AuthNotice } from "@/components/auth-notice";
import { Badge } from "@/components/badge";
import { BillingPortalSubmitButton } from "@/components/billing-portal-submit-button";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { buttonVariants } from "@/components/ui/button";
import {
  formatBillingDate,
  formatSubscriptionAccessState,
  formatSubscriptionStatus,
  formatSubscriptionTier,
} from "@/lib/billing/format";
import { getBillingIntervalForPriceId } from "@/lib/billing/config";
import type { BillingSubscriptionRow } from "@/lib/billing/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/account/billing",
  },
  description:
    "Review current billing status and manage Stripe-hosted subscription settings.",
  openGraph: {
    description:
      "Review current billing status and manage Stripe-hosted subscription settings.",
    title: "Billing",
    url: "/account/billing",
  },
  title: "Billing",
};

export const dynamic = "force-dynamic";

type StripeCustomerRow = {
  stripe_customer_id: string;
};

type BillingPageContext = {
  hasStripeCustomer: boolean;
  stripeCustomerId: string | null;
  subscription: BillingSubscriptionRow | null;
};

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Faccount%2Fbilling");
}

function maskStripeId(value: string | null | undefined) {
  if (!value) {
    return "No";
  }

  if (value.length <= 12) {
    return `${value.slice(0, 4)}...`;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatBoolean(value: boolean | null | undefined) {
  return value ? "Yes" : "No";
}

function getBillingInterval(subscription: BillingSubscriptionRow | null) {
  const interval = getBillingIntervalForPriceId(subscription?.price_id);

  if (interval === "annual") {
    return "Annual";
  }

  if (interval === "monthly") {
    return "Monthly";
  }

  return "Unavailable";
}

function getStatusBadgeTone(status: BillingSubscriptionRow["status"] | null) {
  if (status === "active" || status === "trialing") {
    return "positive";
  }

  if (!status || status === "none") {
    return "muted";
  }

  return "gold";
}

function getInactiveBillingNote(subscription: BillingSubscriptionRow | null) {
  if (!subscription) {
    return "No paid subscription yet.";
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    return null;
  }

  return "Paid access is currently inactive.";
}

async function getBillingPageContext(): Promise<BillingPageContext> {
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    loginRedirect();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    loginRedirect();
  }

  const [subscriptionResult, customerResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    (supabase as unknown as {
      from<T>(table: string): {
        select(columns: string): {
          eq(column: string, value: string): {
            maybeSingle(): Promise<{ data: T | null; error: unknown }>;
          };
        };
      };
    })
      .from<StripeCustomerRow>("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (subscriptionResult.error) {
    throw new Error("Unable to load subscription details.");
  }

  if (customerResult.error) {
    throw new Error("Unable to load billing customer details.");
  }

  return {
    hasStripeCustomer: Boolean(customerResult.data?.stripe_customer_id),
    stripeCustomerId: customerResult.data?.stripe_customer_id ?? null,
    subscription: (subscriptionResult.data ?? null) as BillingSubscriptionRow | null,
  };
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/55 p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function BillingStatusBadge({
  status,
}: {
  status: BillingSubscriptionRow["status"] | null;
}) {
  return (
    <Badge tone={getStatusBadgeTone(status)}>
      {formatSubscriptionStatus(status)}
    </Badge>
  );
}

export default async function AccountBillingPage() {
  const { hasStripeCustomer, stripeCustomerId, subscription } =
    await getBillingPageContext();
  const inactiveNote = getInactiveBillingNote(subscription);
  const canManageBilling = hasStripeCustomer;

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              <Badge tone="gold">Billing</Badge>
              <div className="flex flex-col gap-3">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  Subscription billing
                </h1>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  Review your Stripe-backed subscription status and open
                  Stripe-hosted billing management.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full sm:w-auto"
                )}
                href="/account"
              >
                <ArrowLeft data-icon="inline-start" />
                Account
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full sm:w-auto"
                )}
                href="/pricing"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-6 py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            {inactiveNote ? (
              <AuthNotice message={inactiveNote} tone="info" />
            ) : null}

            <CardShell padding="lg" tone="elevated">
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <CreditCard aria-hidden />
                  </div>
                  <div>
                    <BillingStatusBadge status={subscription?.status ?? null} />
                    <h2 className="mt-3 text-2xl font-semibold text-foreground">
                      Current subscription
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      This page is read-only. Tier and billing status changes
                      are applied by verified Stripe webhook events.
                    </p>
                  </div>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Current tier"
                    value={formatSubscriptionTier(subscription?.tier)}
                  />
                  <DetailItem
                    label="Subscription status"
                    value={formatSubscriptionStatus(subscription?.status)}
                  />
                  <DetailItem
                    label="Access status"
                    value={formatSubscriptionAccessState(
                      subscription?.tier,
                      subscription?.status
                    )}
                  />
                  <DetailItem
                    label="Billing interval"
                    value={getBillingInterval(subscription)}
                  />
                  <DetailItem
                    label="Current period end"
                    value={formatBillingDate(subscription?.current_period_end)}
                  />
                  <DetailItem
                    label="Cancel at period end"
                    value={formatBoolean(subscription?.cancel_at_period_end)}
                  />
                  <DetailItem
                    label="Stripe customer"
                    value={hasStripeCustomer ? "Yes" : "No"}
                  />
                  <DetailItem
                    label="Customer reference"
                    value={maskStripeId(stripeCustomerId)}
                  />
                  <DetailItem
                    label="Latest invoice"
                    value={maskStripeId(subscription?.stripe_latest_invoice_id)}
                  />
                  <DetailItem
                    label="Latest payment"
                    value={maskStripeId(subscription?.stripe_payment_intent_id)}
                  />
                </dl>

                {!subscription ? (
                  <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    No paid subscription yet. Choose a Premium or Pro plan to
                    start Stripe-hosted checkout.
                  </p>
                ) : null}
              </div>
            </CardShell>
          </div>

          <div className="grid gap-6">
            <CardShell padding="lg" tone="subtle">
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <ExternalLink aria-hidden />
                  </div>
                  <div>
                    <Badge tone="muted">Stripe Customer Portal</Badge>
                    <h2 className="mt-3 text-2xl font-semibold text-foreground">
                      Manage billing
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Open Stripe to manage billing details, payment method, or
                      supported subscription changes.
                    </p>
                  </div>
                </div>

                {canManageBilling ? (
                  <form action={createCustomerPortalSessionAction}>
                    <BillingPortalSubmitButton className="w-full" />
                  </form>
                ) : (
                  <Link
                    className={cn(buttonVariants({ size: "lg" }), "w-full")}
                    href="/pricing"
                  >
                    View Pricing
                  </Link>
                )}
              </div>
            </CardShell>

            <CardShell padding="lg">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <ShieldCheck aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Webhook source of truth</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Access updates after Stripe confirms billing.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    There may be a short delay after payment, cancellation, or
                    billing changes while webhook processing completes. Users
                    cannot manually change their tier from this page.
                  </p>
                </div>
              </div>
            </CardShell>
          </div>
        </Container>
      </section>
    </main>
  );
}
