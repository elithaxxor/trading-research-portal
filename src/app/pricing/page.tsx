import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { createCustomerPortalSessionAction } from "@/app/account/billing/actions";
import { createCheckoutSessionAction } from "@/app/pricing/actions";
import { AuthNotice } from "@/components/auth-notice";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { ComparisonTable } from "@/components/comparison-table";
import { Container } from "@/components/container";
import { CTASection } from "@/components/cta-section";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { PageHero } from "@/components/page-hero";
import { PricingCheckoutSubmitButton } from "@/components/pricing-checkout-submit-button";
import { SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import {
  formatSubscriptionAccessState,
  formatSubscriptionStatus,
  formatSubscriptionTier,
} from "@/lib/billing/format";
import { getEffectiveSubscriptionTier } from "@/lib/billing/tiers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/pricing",
  },
  description:
    "Compare Stripe-powered membership options for public, Premium, and Pro trading research access.",
  openGraph: {
    description:
      "Compare Stripe-powered membership options for public, Premium, and Pro trading research access.",
    title: "Pricing",
    url: "/pricing",
  },
  title: "Pricing",
};

export const dynamic = "force-dynamic";

type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionTier =
  Database["public"]["Enums"]["subscription_tier"];
type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];

type PricingPageProps = {
  searchParams?: Promise<{
    billing?: string | string[];
  }>;
};

type PricingContext = {
  accountTier: SubscriptionTier;
  billingStatus: SubscriptionStatus;
  effectiveTier: SubscriptionTier;
  isAuthenticated: boolean;
  isPaidActive: boolean;
  subscription: SubscriptionRow | null;
};

type PaidPlan = {
  badgeLabel?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  price: string;
  tier: "Premium" | "Pro";
};

const freeFeatures = [
  "Public market notes",
  "Selected chart breakdowns",
  "Educational posts",
  "Delayed or limited idea previews",
  "Early access updates",
];

const paidPlans: PaidPlan[] = [
  {
    tier: "Premium",
    price: process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || "Premium",
    description:
      "For members who want structured trading ideas, every published Pine Script, Lite software access, watchlists, and member dashboard workflows.",
    features: [
      "Premium trading ideas and content",
      "Lite software library access",
      "Indicators library access",
      "Saved ideas, followed tickers, and watchlist workflows",
      "Premium chart breakdowns",
      "Update logs and closed idea reviews",
      "Member dashboard personalization",
    ],
    highlighted: true,
    badgeLabel: "Recommended",
  },
  {
    tier: "Pro",
    price: process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_LABEL || "Pro",
    description:
      "For members who want Pro research access, Lite + Pro software, a Pro-only tools workspace, and deeper research context.",
    features: [
      "Everything in Premium",
      "Pro-only research notes",
      "Lite + Pro software library access",
      "Indicators library access",
      "Pro-only tools workspace",
      "Pro-only Strat Lab",
      "Advanced research access",
      "Pro lifecycle reviews",
      "Full member dashboard workflows",
    ],
  },
];

const comparisonRows = [
  {
    feature: "Strat Lab",
    free: false,
    premium: "Pro only",
  },
  {
    feature: "Pro tools workspace",
    free: false,
    premium: "Pro only",
  },
  {
    feature: "Indicators library",
    free: "Individual pricing later",
    premium: true,
  },
  {
    feature: "Public market notes",
    free: true,
    premium: true,
  },
  {
    feature: "Selected chart breakdowns",
    free: true,
    premium: true,
  },
  {
    feature: "Premium trading ideas",
    free: false,
    premium: true,
  },
  {
    feature: "Member dashboard workflows",
    free: false,
    premium: true,
  },
  {
    feature: "Lite software access",
    free: false,
    premium: true,
  },
  {
    feature: "Pro software and Pro-only research",
    free: false,
    premium: "Pro only",
  },
  {
    feature: "Closed idea reviews",
    free: false,
    premium: true,
  },
];

const faqs = [
  {
    question: "Is this financial advice?",
    answer:
      "No. The site provides educational market research, commentary, watchlists, and chart-based examples for independent review.",
  },
  {
    question: "Do you guarantee results?",
    answer:
      "No plan guarantees trading results. Markets are uncertain, and every trader is responsible for their own decisions and risk.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Subscriptions renew until canceled. Billing is managed through Stripe-hosted Checkout and Customer Portal flows. Access changes apply after Stripe confirms subscription state through webhooks.",
  },
  {
    question: "What is included in Premium?",
    answer:
      "Premium includes structured trading ideas, the member dashboard, every published Pine Script, Lite software access, watchlists, update logs, premium chart breakdowns, and closed idea reviews.",
  },
  {
    question: "Can I upgrade to Pro?",
    answer:
      "Use Stripe billing management for plan changes once portal plan updates are configured. The app does not grant upgrades from frontend-only state.",
  },
  {
    question: "How are payments processed?",
    answer:
      "Payments are processed by Stripe. The portal does not store card details or run custom payment forms.",
  },
  {
    question: "How does software access work?",
    answer:
      "Premium and Pro both include every published Pine Script. Premium also unlocks Lite software, while Pro unlocks Lite + Pro software. Individual Pine Script pricing for free accounts will be added later. TradingView invite-only access may require manual admin approval.",
  },
];

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getBillingNotice(billing?: string | string[]) {
  switch (getFirstParam(billing)) {
    case "cancelled":
      return "Checkout was cancelled. No subscription change was made.";
    case "no_customer":
      return "No billing account exists yet. Choose a Premium or Pro plan to start checkout.";
    case "invalid_checkout_selection":
      return "Choose a valid Premium or Pro billing option to continue.";
    case "checkout_unavailable":
      return "Checkout is temporarily unavailable. Stripe billing configuration is being verified.";
    default:
      return null;
  }
}

async function getPricingContext(): Promise<PricingContext> {
  const fallback: PricingContext = {
    accountTier: "free",
    billingStatus: "none",
    effectiveTier: "free",
    isAuthenticated: false,
    isPaidActive: false,
    subscription: null,
  };

  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    return fallback;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return fallback;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const accountTier = subscription?.tier ?? "free";
  const billingStatus = subscription?.status ?? "none";
  const effectiveTier = getEffectiveSubscriptionTier(
    accountTier,
    billingStatus
  );

  return {
    accountTier,
    billingStatus,
    effectiveTier,
    isAuthenticated: true,
    isPaidActive: effectiveTier === "premium" || effectiveTier === "pro",
    subscription,
  };
}

function BillingNotice({ billing }: { billing?: string | string[] }) {
  const notice = getBillingNotice(billing);

  if (!notice) {
    return null;
  }

  return <AuthNotice message={notice} tone="info" />;
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="grid gap-3">
      {features.map((feature) => (
        <li className="flex items-start gap-3 text-sm" key={feature}>
          <CheckCircle2
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-positive"
          />
          <span className="leading-6 text-muted-foreground">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckoutForm({
  interval,
  label,
  tier,
  variant = "default",
}: {
  interval: "monthly" | "annual";
  label: string;
  tier: "premium" | "pro";
  variant?: "default" | "outline";
}) {
  return (
    <form action={createCheckoutSessionAction} className="min-w-0">
      <input name="tier" type="hidden" value={tier} />
      <input name="interval" type="hidden" value={interval} />
      <input name="returnPath" type="hidden" value="/account" />
      <PricingCheckoutSubmitButton
        analyticsEventName="checkout_started"
        analyticsProperties={{
          billing_interval: interval,
          requested_tier: tier,
        }}
        className="w-full"
        label={label}
        pendingLabel="Opening Stripe..."
        variant={variant}
      />
    </form>
  );
}

function ManageBillingForm({ label = "Manage billing" }: { label?: string }) {
  return (
    <form action={createCustomerPortalSessionAction} className="min-w-0">
      <PricingCheckoutSubmitButton
        className="w-full"
        label={label}
        pendingLabel="Opening portal..."
        variant="outline"
      />
    </form>
  );
}

function AuthLinks() {
  return (
    <div className="mt-auto grid gap-3">
      <Link
        className={cn(buttonVariants({ size: "lg", variant: "default" }))}
        href={`/login?redirectedFrom=${encodeURIComponent("/pricing")}`}
      >
        Sign in to subscribe
      </Link>
      <Link
        className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
        href={`/register?redirectedFrom=${encodeURIComponent("/pricing")}`}
      >
        Create account
      </Link>
    </div>
  );
}

function FreePlanCard({ context }: { context: PricingContext }) {
  const isCurrentPlan = context.effectiveTier === "free";

  return (
    <CardShell
      className="relative flex h-full flex-col gap-7 overflow-hidden"
      padding="lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Free</h2>
          <p className="mt-3 font-mono text-sm uppercase tracking-[0.16em] text-primary">
            $0
          </p>
        </div>
        {isCurrentPlan ? <Badge tone="muted">Current access</Badge> : null}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Public market commentary and selected free research.
      </p>
      <FeatureList features={freeFeatures} />
      <Link
        className={cn(
          "mt-auto",
          buttonVariants({ size: "lg", variant: "outline" })
        )}
        href="/free"
      >
        View Free Research
      </Link>
    </CardShell>
  );
}

function PaidPlanCard({
  context,
  plan,
}: {
  context: PricingContext;
  plan: PaidPlan;
}) {
  const tier = plan.tier === "Premium" ? "premium" : "pro";
  const isCurrentPlan = context.effectiveTier === tier;
  const hasHigherPlan = context.effectiveTier === "pro" && tier === "premium";
  const canStartCheckout = context.isAuthenticated && !context.isPaidActive;
  const shouldManageBilling =
    context.isAuthenticated &&
    (isCurrentPlan || hasHigherPlan || context.isPaidActive);

  return (
    <CardShell
      className={cn(
        "relative flex h-full flex-col gap-7 overflow-hidden",
        plan.highlighted && "border-primary/40 bg-primary/8"
      )}
      padding="lg"
      tone={plan.highlighted ? "elevated" : "default"}
    >
      {plan.highlighted ? (
        <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{plan.tier}</h2>
          <p className="mt-3 font-mono text-sm uppercase tracking-[0.16em] text-primary">
            {plan.price}
          </p>
        </div>
        {isCurrentPlan ? (
          <Badge tone="gold">Current plan</Badge>
        ) : plan.highlighted ? (
          <Badge tone="gold">{plan.badgeLabel}</Badge>
        ) : null}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {plan.description}
      </p>
      <FeatureList features={plan.features} />

      {!context.isAuthenticated ? <AuthLinks /> : null}

      {canStartCheckout ? (
        <div className="mt-auto grid gap-3">
          <CheckoutForm
            interval="monthly"
            label={`Start ${plan.tier} monthly`}
            tier={tier}
            variant={plan.highlighted ? "default" : "outline"}
          />
          <CheckoutForm
            interval="annual"
            label={`Start ${plan.tier} annual`}
            tier={tier}
            variant="outline"
          />
        </div>
      ) : null}

      {shouldManageBilling ? (
        <div className="mt-auto grid gap-3">
          {isCurrentPlan ? (
            <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
              This is your current active access level.
            </p>
          ) : null}
          {hasHigherPlan ? (
            <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Downgrades should be handled through Stripe billing management.
            </p>
          ) : null}
          {context.effectiveTier === "premium" && tier === "pro" ? (
            <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Use billing management for upgrades while the Stripe portal is
              configured for plan changes.
            </p>
          ) : null}
          <ManageBillingForm
            label={
              context.effectiveTier === "premium" && tier === "pro"
                ? "Manage billing / upgrade"
                : "Manage billing"
            }
          />
        </div>
      ) : null}
    </CardShell>
  );
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    getPricingContext(),
  ]);

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/free", label: "View Free Research" },
              {
                href: context.isAuthenticated ? "/account" : "/register",
                label: context.isAuthenticated
                  ? "View Account"
                  : "Create Account",
                variant: "outline",
              },
            ]}
            description="Compare public research, Premium membership, and Pro research/software access. Paid access updates after Stripe confirms subscription state through webhooks."
            eyebrow="Membership pricing"
            title="Choose the research access level that fits how you study markets."
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <BillingNotice billing={params?.billing} />

          {context.isAuthenticated ? (
            <CardShell padding="md" tone="subtle">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge tone="muted">Your account</Badge>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Account tier:{" "}
                    <span className="font-medium text-foreground">
                      {formatSubscriptionTier(context.accountTier)}
                    </span>{" "}
                    / Billing status:{" "}
                    <span className="font-medium text-foreground">
                      {formatSubscriptionStatus(context.billingStatus)}
                    </span>{" "}
                    / Active access:{" "}
                    <span className="font-medium text-foreground">
                      {formatSubscriptionAccessState(
                        context.accountTier,
                        context.billingStatus
                      )}
                    </span>
                  </p>
                </div>
                {context.isPaidActive ? <ManageBillingForm /> : null}
              </div>
            </CardShell>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-3">
            <FreePlanCard context={context} />
            {paidPlans.map((plan) => (
              <PaidPlanCard context={context} key={plan.tier} plan={plan} />
            ))}
          </div>

          <CardShell
            className="border-primary/24 bg-primary/6"
            padding="md"
            tone="subtle"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <Badge tone="gold">Billing note</Badge>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Prices and plan labels are configured per environment in
                  Stripe. Do not mix Stripe test and live mode configuration.
                </p>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Payments are processed by Stripe. Subscription changes update
                access after successful payment and webhook processing.
                Subscriptions renew until canceled.
              </p>
            </div>
          </CardShell>
        </Container>
      </section>

      <section className="border-y border-border bg-surface/38 py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Plan comparison"
            title="Free public research, Premium dashboard access, and Pro research."
            description="The comparison shows what public readers can access and how paid tiers unlock member research and software workflows."
          />
          <ComparisonTable rows={comparisonRows} />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Pricing FAQ"
            title="Straight answers before subscribing."
            description="The goal is to make the research model clear without implying guaranteed results or broker-connected execution."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <CardShell key={item.question} padding="md">
                <h2 className="text-base font-semibold text-foreground">
                  {item.question}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </CardShell>
            ))}
          </div>
        </Container>
      </section>

      <Container>
        <DisclaimerBanner message="Subscriptions provide educational market research only. No plan guarantees trading results. Trading involves risk, including possible loss." />
        <DisclaimerBanner message="Payments are processed by Stripe. Subscription access updates after Stripe confirms payment and webhook processing. This portal does not connect to brokers, execute orders, or provide copy-trading automation." />
        <CTASection
          description="Start with public market notes or sign in to manage research membership access through Stripe-hosted billing."
          headline="Review the research style before choosing a plan."
          primaryCta={{ href: "/free", label: "View Free Research" }}
          secondaryCta={{
            href: context.isAuthenticated ? "/account" : "/register",
            label: context.isAuthenticated ? "View Account" : "Create Account",
          }}
        />
      </Container>
    </main>
  );
}
