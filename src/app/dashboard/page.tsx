import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  BookOpenText,
  ListChecks,
  UserRound,
} from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/badge";
import { AuthNotice } from "@/components/auth-notice";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { SignOutSubmitButton } from "@/components/sign-out-submit-button";
import { ensureUserRecords } from "@/lib/auth/ensure-user-records";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/dashboard",
  },
  description:
    "Private dashboard shell for Trading Research Portal account access.",
  openGraph: {
    description:
      "Private dashboard shell for Trading Research Portal account access.",
    title: "Dashboard",
    url: "/dashboard",
  },
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

const dashboardCards = [
  {
    description:
      "A future workspace for risk-defined research cards and status tracking.",
    href: null,
    icon: BarChart3,
    label: "Active Ideas",
  },
  {
    description:
      "A future place to organize symbols and research notes you want to monitor.",
    href: null,
    icon: ListChecks,
    label: "Watchlist",
  },
  {
    description:
      "A future feed for market commentary, chart breakdowns, and update logs.",
    href: null,
    icon: BookOpenText,
    label: "Latest Research",
  },
  {
    description:
      "Review account details and future profile settings when the account page opens.",
    href: "/account",
    icon: UserRound,
    label: "Account",
  },
];

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Fdashboard");
}

async function getDashboardContext() {
  const warnings: string[] = [];
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

  await ensureUserRecords(user).catch(() => {
    warnings.push(
      "Account setup is still preparing. Some dashboard details may show default access until setup finishes."
    );
  });

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("tier,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    warnings.push(
      "We could not load subscription details right now. Your account is shown with safe default access."
    );
  }

  return {
    subscription,
    user,
    warnings,
  };
}

function formatTier(subscription: Pick<SubscriptionRow, "tier"> | null) {
  const tier = subscription?.tier ?? "free";

  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function formatStatus(
  subscription: Pick<SubscriptionRow, "status"> | null
) {
  if (!subscription) {
    return "Free access";
  }

  return subscription.status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const { subscription, user, warnings } = await getDashboardContext();
  const tierLabel = formatTier(subscription);
  const statusLabel = formatStatus(subscription);

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              <Badge tone="gold">Member dashboard</Badge>
              <div className="flex flex-col gap-3">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  Welcome to your research dashboard.
                </h1>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  This Phase 3 shell confirms secure account access before
                  premium research content, watchlists, and update logs are
                  connected.
                </p>
              </div>
            </div>

            <form action={signOutAction}>
              <SignOutSubmitButton className="w-full sm:w-auto" />
            </form>
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-6 py-10 sm:py-12">
          {warnings.map((warning) => (
            <AuthNotice key={warning} message={warning} tone="info" />
          ))}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <CardShell padding="lg" tone="elevated">
              <div className="flex flex-col gap-6">
                <div>
                  <Badge tone="muted">Signed in</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Account access
                  </h2>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <dt className="text-sm text-muted-foreground">Email</dt>
                    <dd className="mt-2 break-words text-sm font-medium text-foreground">
                      {user.email ?? "Email unavailable"}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <dt className="text-sm text-muted-foreground">
                      Current tier
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {tierLabel}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/35 p-4 sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">
                      Subscription status
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {statusLabel}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardShell>

            <CardShell padding="lg" tone="subtle">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <Badge tone="muted">Access note</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Research modules are coming soon
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    The dashboard is intentionally limited to account access in
                    this step. Premium ideas, watchlists, and chart breakdowns
                    will be connected in later authenticated phases.
                  </p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  No trading results are guaranteed. All research content is
                  educational and should be reviewed independently.
                </p>
              </div>
            </CardShell>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <CardShell
                className="flex min-h-56 flex-col justify-between"
                key={card.label}
                padding="md"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <card.icon aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {card.label}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </div>

                {card.href ? (
                  <Link
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-foreground"
                    href={card.href}
                  >
                    Open account
                    <ArrowUpRight aria-hidden className="size-4" />
                  </Link>
                ) : (
                  <p className="mt-6 text-sm font-medium text-muted-foreground">
                    Coming soon
                  </p>
                )}
              </CardShell>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
