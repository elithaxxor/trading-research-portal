import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/badge";
import { AuthNotice } from "@/components/auth-notice";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { SignOutSubmitButton } from "@/components/sign-out-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { ensureUserRecords } from "@/lib/auth/ensure-user-records";
import {
  formatSubscriptionAccessState,
  formatSubscriptionStatus,
  formatSubscriptionTier,
} from "@/lib/billing/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/account",
  },
  description:
    "View basic Trading Research Portal account and subscription details.",
  openGraph: {
    description:
      "View basic Trading Research Portal account and subscription details.",
    title: "Account",
    url: "/account",
  },
  title: "Account",
};

export const dynamic = "force-dynamic";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

type AccountPageProps = {
  searchParams?: Promise<{
    billing?: string | string[];
    status?: string | string[];
  }>;
};

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Faccount");
}

function formatEnumValue(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

async function getAccountContext() {
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
      "Account setup is still preparing. Some details may show fallback values until setup finishes."
    );
  });

  const [profileResult, subscriptionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("email,full_name,role,created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("tier,status,current_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    warnings.push(
      "We could not load profile details right now. Your email and safe defaults are shown instead."
    );
  }

  if (subscriptionResult.error) {
    warnings.push(
      "We could not load subscription details right now. Free access is shown as a safe default."
    );
  }

  return {
    profile: profileResult.data,
    subscription: subscriptionResult.data,
    user,
    warnings,
  };
}

function getProfileValue(
  profile: Pick<ProfileRow, "full_name"> | null,
  fallback = "Not provided"
) {
  return profile?.full_name || fallback;
}

function getRole(profile: Pick<ProfileRow, "role"> | null) {
  return profile?.role ? formatEnumValue(profile.role) : "User";
}

function getTier(subscription: Pick<SubscriptionRow, "tier"> | null) {
  return formatSubscriptionTier(subscription?.tier);
}

function getStatus(subscription: Pick<SubscriptionRow, "status"> | null) {
  return formatSubscriptionStatus(subscription?.status);
}

function getActiveAccess(
  subscription: Pick<SubscriptionRow, "status" | "tier"> | null
) {
  return formatSubscriptionAccessState(
    subscription?.tier,
    subscription?.status
  );
}

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getAccountNotice(status?: string | string[]) {
  if (getFirstParam(status) === "password_updated") {
    return "Your password has been updated.";
  }

  return null;
}

function getBillingNotice(billing?: string | string[]) {
  switch (getFirstParam(billing)) {
    case "already_active":
      return "You already have an active membership. Use the billing management flow for plan changes once the customer portal is enabled.";
    case "success":
      return "Checkout finished. Access updates after Stripe confirms the subscription through the webhook.";
    case "portal_return":
      return "You returned from Stripe billing management.";
    default:
      return null;
  }
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const passwordNotice = getAccountNotice(params?.status);
  const billingNotice = getBillingNotice(params?.billing);
  const { profile, subscription, user, warnings } = await getAccountContext();
  const email = profile?.email ?? user.email ?? "Email unavailable";

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              <Badge tone="gold">Account</Badge>
              <div className="flex flex-col gap-3">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  Account details
                </h1>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  Review your profile and subscription status for private
                  research dashboard access.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full sm:w-auto"
                )}
                href="/dashboard"
              >
                <ArrowLeft data-icon="inline-start" />
                Dashboard
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full sm:w-auto"
                )}
                href="/account/billing"
              >
                Billing
              </Link>
              <form action={signOutAction}>
                <SignOutSubmitButton className="w-full sm:w-auto" />
              </form>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-6 py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr]">
          {passwordNotice ? (
            <AuthNotice
              className="lg:col-span-2"
              message={passwordNotice}
              tone="success"
            />
          ) : null}

          {billingNotice ? (
            <AuthNotice
              className="lg:col-span-2"
              message={billingNotice}
              tone="info"
            />
          ) : null}

          {warnings.map((warning) => (
            <AuthNotice
              className="lg:col-span-2"
              key={warning}
              message={warning}
              tone="info"
            />
          ))}

          <CardShell padding="lg" tone="elevated">
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <UserRound aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Profile</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Basic profile
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Profile editing is not enabled yet. Role changes are not
                    available from this page.
                  </p>
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Email" value={email} />
                <DetailItem label="Full name" value={getProfileValue(profile)} />
                <DetailItem label="Role" value={getRole(profile)} />
                <DetailItem
                  label="Account created"
                  value={formatDate(profile?.created_at)}
                />
              </dl>

              {!profile ? (
                <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Profile details are not available yet. This can happen if the
                  profile trigger did not create a row during signup; a repair
                  action can be added in a later Phase 3 step.
                </p>
              ) : null}
            </div>
          </CardShell>

          <div className="grid gap-6">
            <CardShell padding="lg" tone="subtle">
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <CreditCard aria-hidden />
                  </div>
                  <div>
                    <Badge tone="muted">Subscription</Badge>
                    <h2 className="mt-3 text-2xl font-semibold text-foreground">
                      Current tier/status summary
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Billing is managed through Stripe-hosted Checkout and the
                      Customer Portal. This page only displays webhook-synced
                      access state.
                    </p>
                  </div>
                </div>

                <dl className="grid gap-4">
                  <DetailItem
                    label="Account tier"
                    value={getTier(subscription)}
                  />
                  <DetailItem
                    label="Billing status"
                    value={getStatus(subscription)}
                  />
                  <DetailItem
                    label="Active access"
                    value={getActiveAccess(subscription)}
                  />
                  <DetailItem
                    label="Current period end"
                    value={formatDate(subscription?.current_period_end)}
                  />
                </dl>

                {!subscription ? (
                  <p className="rounded-lg border border-border bg-background/55 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    No subscription row exists yet. The account is treated as
                    free with status none until subscription logic is added.
                  </p>
                ) : null}

                <Link
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                  href="/account/billing"
                >
                  Manage Billing
                </Link>
              </div>
            </CardShell>

            <CardShell padding="lg">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <ShieldCheck aria-hidden />
                </div>
                <div>
                  <Badge tone="muted">Security note</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Protected account access
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Account data is loaded server-side through Supabase RLS
                    using the current user session, not an admin client.
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/35 p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
