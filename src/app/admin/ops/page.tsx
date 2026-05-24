import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileText,
  Mail,
  PackageCheck,
  ServerCog,
  ShieldAlert,
  Users,
} from "lucide-react";

import { ReadinessStatusBadge } from "@/components/admin/ops/ReadinessStatusBadge";
import { OpsPageHeader } from "@/components/admin/ops/OpsPageHeader";
import { OpsStatCard } from "@/components/admin/ops/OpsStatCard";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import {
  formatFeatureFlagState,
  getFeatureFlagTone,
} from "@/lib/flags/format";
import { listFeatureFlags } from "@/lib/flags/server";
import { getAdminOpsOverview } from "@/lib/ops/metrics";
import { listReadinessChecks } from "@/lib/ops/readiness";
import { formatMetricDate } from "@/lib/ops/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Operations",
};

function getOptionalEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function isEnabledEnv(name: string) {
  return ["1", "true", "yes", "on"].includes(getOptionalEnv(name).toLowerCase());
}

function bucketCount(
  buckets: Array<{ count: number; label: string }>,
  label: string
) {
  return buckets.find((bucket) => bucket.label === label)?.count ?? 0;
}

function bucketTotal(buckets: Array<{ count: number }>) {
  return buckets.reduce((total, bucket) => total + bucket.count, 0);
}

function getBuildSummary() {
  const commit =
    getOptionalEnv("COMMIT_REF") || getOptionalEnv("VERCEL_GIT_COMMIT_SHA");

  return {
    branch: getOptionalEnv("BRANCH") || "local",
    commit: commit ? commit.slice(0, 8) : "not provided",
    context: getOptionalEnv("CONTEXT") || "local",
    deployIdConfigured: Boolean(getOptionalEnv("DEPLOY_ID")),
  };
}

export default async function AdminOpsPage() {
  await requireAdmin("/admin/ops");

  const [overview, checks] = await Promise.all([
    getAdminOpsOverview(),
    listReadinessChecks(),
  ]);
  const featureFlags = listFeatureFlags();
  const build = getBuildSummary();
  const queuedEmailCount = bucketCount(
    overview.email.notificationsByStatus,
    "queued"
  );
  const softwareAccessRequestCount = bucketTotal(
    overview.software.accessRequestsByStatus
  );
  const supabaseSeparationCheck = checks.find(
    (check) => check.key === "production_supabase_project_separated_or_approved"
  );
  const warnings = [
    !isEnabledEnv("EMAIL_SEND_ENABLED")
      ? "Production email sending is disabled. Keep it off until sender/domain, legal, and business approval are complete."
      : "Email sending is enabled in this environment. Confirm this is intentional before production launch.",
    !getOptionalEnv("STRIPE_SECRET_KEY")
      ? "Live Stripe billing is not configured in this environment."
      : "Stripe secret configuration is present. Confirm live subscriptions are approved before launch.",
    supabaseSeparationCheck?.status !== "passing"
      ? "Production Supabase project separation or approval is still pending readiness sign-off."
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <OpsPageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/readiness"
            >
              Readiness
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/incidents"
            >
              Incidents
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/launch"
            >
              Launch
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/email"
            >
              Email
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/stripe"
            >
              Stripe
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/metrics"
            >
              Metrics
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/events"
            >
              Events
            </Link>
          </>
        }
        description="Monitor launch readiness, core platform health, incidents, and operational metrics without enabling live billing or production email."
        title="Operations"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsStatCard
          description="Launch posture from blocking readiness gates."
          icon={overview.readiness.launchBlocked ? ShieldAlert : CheckCircle2}
          label="App Health"
          tone={overview.readiness.launchBlocked ? "warning" : "positive"}
          value={overview.readiness.launchBlocked ? "Review" : "OK"}
        />
        <OpsStatCard
          description="Open incident records requiring admin attention."
          icon={AlertTriangle}
          label="Unresolved Incidents"
          tone={overview.system.openIncidents > 0 ? "danger" : "positive"}
          value={String(overview.system.openIncidents)}
        />
        <OpsStatCard
          description="Launch-blocking checks not yet passing or skipped."
          icon={ServerCog}
          label="Blocking Checks"
          tone={overview.readiness.blockingOpenCount > 0 ? "warning" : "positive"}
          value={String(overview.readiness.blockingOpenCount)}
        />
        <OpsStatCard
          description="Short deploy context and commit reference."
          icon={Activity}
          label="Deploy"
          value={`${build.context} / ${build.commit}`}
        />
        <OpsStatCard
          description="Trading ideas plus research posts in the CMS."
          icon={FileText}
          label="Content Records"
          value={String(overview.content.totalIdeas + overview.content.totalPosts)}
        />
        <OpsStatCard
          description="Non-admin member profiles currently known to the portal."
          icon={Users}
          label="Members"
          value={String(overview.members.members)}
        />
        <OpsStatCard
          description="Active paid subscription rows in Supabase."
          icon={CreditCard}
          label="Active Subscriptions"
          value={String(overview.members.activePaidSubscriptions)}
        />
        <OpsStatCard
          description="Queued notifications waiting for controlled processing."
          icon={Mail}
          label="Queued Email"
          value={String(queuedEmailCount)}
        />
        <OpsStatCard
          description="All software access requests by members."
          icon={PackageCheck}
          label="Software Requests"
          value={String(softwareAccessRequestCount)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.6fr)]">
        <CardShell padding="md" tone="subtle">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Launch Warnings
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  These items are informational gates; they do not toggle live
                  Stripe or email behavior.
                </p>
              </div>
              <Badge tone="gold">Safe-Off</Badge>
            </div>
            <div className="space-y-3">
              {warnings.map((warning) => (
                <div
                  className="rounded-lg border border-gold-400/25 bg-gold-400/10 px-4 py-3 text-sm leading-6 text-gold-100"
                  key={warning}
                >
                  {warning}
                </div>
              ))}
            </div>
          </div>
        </CardShell>

        <CardShell padding="md" tone="subtle">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Blocking Checklist
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Top launch gates that still need evidence or approval.
              </p>
            </div>
            <div className="space-y-3">
              {checks
                .filter(
                  (check) =>
                    check.blocking_launch &&
                    check.status !== "passing" &&
                    check.status !== "skipped"
                )
                .slice(0, 6)
                .map((check) => (
                  <div
                    className="rounded-lg border border-border bg-background/60 p-3"
                    key={check.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {check.title}
                      </p>
                      <ReadinessStatusBadge status={check.status} />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {check.evidence_note || check.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </CardShell>
      </section>

      <CardShell padding="md" tone="subtle">
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Launch Controls
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Feature flags are operational kill switches only. Server-side
                tier checks, RLS, webhook sync, and preferences remain the source
                of truth.
              </p>
            </div>
            <Badge tone="muted">Env backed</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featureFlags.map((flag) => (
              <div
                className="rounded-lg border border-border bg-background/60 p-4"
                key={flag.key}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {flag.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {flag.description}
                    </p>
                  </div>
                  <Badge tone={getFeatureFlagTone(flag)}>
                    {formatFeatureFlagState(flag)}
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Source: {flag.sourceEnvVar} ({flag.source})
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {flag.safetyNote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardShell>

      <p className="text-xs leading-5 text-muted-foreground">
        Generated {formatMetricDate(overview.generatedAt)}. Branch:{" "}
        {build.branch}. Deploy id present: {build.deployIdConfigured ? "yes" : "no"}.
      </p>
    </div>
  );
}
