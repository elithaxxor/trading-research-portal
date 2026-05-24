import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Bell, MailCheck, ShieldCheck } from "lucide-react";

import { updateNotificationPreferencesAction } from "@/app/account/notifications/actions";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { PreferencesSubmitButton } from "@/components/dashboard/PreferencesSubmitButton";
import { MemberActionNotice } from "@/components/member-action-notice";
import { buttonVariants } from "@/components/ui/button";
import { ensureNotificationPreferences } from "@/lib/email/preferences";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/account/notifications",
  },
  description:
    "Manage Trading Research Portal email notification preferences.",
  title: "Notification Preferences",
};

export const dynamic = "force-dynamic";

type AccountNotificationsPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

const digestDays = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Faccount%2Fnotifications");
}

async function getNotificationPageContext() {
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

  return {
    preferences: await ensureNotificationPreferences(user.id),
    user,
  };
}

function formatDigestTime(value: string) {
  return value.slice(0, 5);
}

export default async function AccountNotificationsPage({
  searchParams,
}: AccountNotificationsPageProps) {
  const params = await searchParams;
  const { preferences, user } = await getNotificationPageContext();
  const optionalEnabled = [
    preferences.content_new_ideas,
    preferences.content_idea_updates,
    preferences.lifecycle_updates,
    preferences.closed_reviews,
    preferences.weekly_digest,
  ].filter(Boolean).length;

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              <Badge tone="gold">Notifications</Badge>
              <div className="flex flex-col gap-3">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  Email preferences
                </h1>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  Choose which research, lifecycle, digest, software, and
                  account emails you want to receive.
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
                href="/dashboard"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-8 py-10 sm:py-12">
          <MemberActionNotice notice={params?.notice} />

          <div className="grid gap-4 md:grid-cols-3">
            <DashboardStatCard
              description="Content and digest emails are optional and can be changed at any time."
              icon={Bell}
              label="Optional groups"
              value={`${optionalEnabled}/5`}
            />
            <DashboardStatCard
              description="Software, billing, and account status emails may still be sent when needed."
              icon={ShieldCheck}
              label="Transactional"
              value="Protected"
            />
            <DashboardStatCard
              description="Preferences are saved only for your authenticated account."
              icon={MailCheck}
              label="Account"
              value={user.email ?? "Signed in"}
            />
          </div>

          <form action={updateNotificationPreferencesAction}>
            <CardShell padding="lg" tone="elevated">
              <div className="grid gap-8">
                <div className="rounded-lg border border-border bg-secondary/25 p-4">
                  <CheckboxField
                    defaultChecked={preferences.email_enabled}
                    description="Allow optional research and digest emails. Transactional account, billing, and software status emails may still be sent when needed."
                    label="Enable optional email notifications"
                    name="email_enabled"
                  />
                </div>

                <PreferenceGroup
                  description="These messages use safe summaries and links back to protected portal pages."
                  title="Content and lifecycle"
                >
                  <CheckboxField
                    defaultChecked={preferences.content_new_ideas}
                    description="Receive safe-preview emails when new ideas are published for your access level."
                    label="New ideas"
                    name="content_new_ideas"
                  />
                  <CheckboxField
                    defaultChecked={preferences.content_idea_updates}
                    description="Receive safe summaries when ideas you can access are updated."
                    label="Idea updates"
                    name="content_idea_updates"
                  />
                  <CheckboxField
                    defaultChecked={preferences.lifecycle_updates}
                    description="Receive lifecycle event summaries without private trade details."
                    label="Lifecycle updates"
                    name="lifecycle_updates"
                  />
                  <CheckboxField
                    defaultChecked={preferences.closed_reviews}
                    description="Receive closed-review notices that avoid performance promises."
                    label="Closed reviews"
                    name="closed_reviews"
                  />
                </PreferenceGroup>

                <PreferenceGroup
                  description="Weekly digest emails group safe previews of recent portal activity."
                  title="Digest"
                >
                  <CheckboxField
                    defaultChecked={preferences.weekly_digest}
                    description="Receive a weekly digest of safe summaries and protected links."
                    label="Weekly digest"
                    name="weekly_digest"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Digest day
                      </span>
                      <select
                        className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
                        defaultValue={preferences.digest_day_of_week}
                        name="digest_day_of_week"
                      >
                        {digestDays.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Digest time UTC
                      </span>
                      <input
                        className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
                        defaultValue={formatDigestTime(
                          preferences.digest_time_utc
                        )}
                        name="digest_time_utc"
                        type="time"
                      />
                    </label>
                  </div>
                </PreferenceGroup>

                <PreferenceGroup
                  description="These are status and account workflow emails. They do not include card details, receipts, private Pine source code, or TradingView automation."
                  title="Transactional status"
                >
                  <CheckboxField
                    defaultChecked={preferences.software_access_updates}
                    description="Receive software access request status emails. TradingView invite-only access remains manual."
                    label="Software access updates"
                    name="software_access_updates"
                  />
                  <CheckboxField
                    defaultChecked={preferences.billing_account_updates}
                    description="Receive important account and billing access status emails. Stripe handles payment receipts."
                    label="Billing and account status"
                    name="billing_account_updates"
                  />
                </PreferenceGroup>

                <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Content and digest emails are optional. Transactional
                    software, billing, and account status emails may still be
                    sent when needed. You can update preferences any time.
                  </p>
                  <PreferencesSubmitButton
                    analyticsEventName="notification_preference_updated"
                    analyticsProperties={{
                      route: "/account/notifications",
                    }}
                    label="Save preferences"
                    pendingLabel="Saving..."
                  />
                </div>
              </div>
            </CardShell>
          </form>
        </Container>
      </section>
    </main>
  );
}

function PreferenceGroup({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <fieldset className="grid gap-4">
      <div>
        <legend className="text-lg font-semibold text-foreground">
          {title}
        </legend>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CheckboxField({
  defaultChecked,
  description,
  label,
  name,
}: {
  defaultChecked: boolean;
  description: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex gap-3 rounded-lg border border-border bg-secondary/25 p-4">
      <input
        className="mt-1 size-4 rounded border-border accent-primary"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
