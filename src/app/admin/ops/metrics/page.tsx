import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CreditCard,
  FileText,
  Mail,
  PackageCheck,
  ShieldAlert,
  Users,
} from "lucide-react";

import { OpsPageHeader } from "@/components/admin/ops/OpsPageHeader";
import { OpsStatCard } from "@/components/admin/ops/OpsStatCard";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { formatMetricDate } from "@/lib/ops/format";
import { getAdminDetailedMetrics } from "@/lib/ops/metrics";
import type { AdminDetailedMetrics } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations Metrics",
};

type MetricTone = "default" | "positive" | "warning";

type MetricRow = {
  description: string;
  label: string;
  tone?: MetricTone;
  value: number;
};

type MetricSectionConfig = {
  description: string;
  icon: LucideIcon;
  rows: MetricRow[];
  title: string;
};

function getToneLabel(tone: MetricTone) {
  if (tone === "positive") {
    return "ok";
  }

  if (tone === "warning") {
    return "watch";
  }

  return "info";
}

function getBadgeTone(tone: MetricTone) {
  if (tone === "positive") {
    return "positive" as const;
  }

  if (tone === "warning") {
    return "gold" as const;
  }

  return "muted" as const;
}

function MetricSection({
  description,
  icon: Icon,
  rows,
  title,
}: {
  description: string;
  icon: LucideIcon;
  rows: MetricRow[];
  title: string;
}) {
  return (
    <CardShell padding="md" tone="elevated">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const tone = row.tone ?? "default";

            return (
              <div
                className="rounded-lg border border-border bg-background/60 p-4"
                key={row.label}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">
                      {row.value}
                    </p>
                  </div>
                  {row.tone ? (
                    <Badge tone={getBadgeTone(tone)}>
                      {getToneLabel(tone)}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {row.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}

function createSections(
  metrics: AdminDetailedMetrics
): MetricSectionConfig[] {
  const recentLabel = `last ${metrics.recentWindowDays} days`;

  return [
    {
      description:
        "Counts only; no thesis, exact levels, private updates, outcomes, or chart internals are shown.",
      icon: FileText,
      rows: [
        {
          description: "All ideas in the CMS.",
          label: "Total Ideas",
          value: metrics.content.totalIdeas,
        },
        {
          description: "Published ideas visible through public/member routes.",
          label: "Published Ideas",
          value: metrics.content.publishedIdeas,
        },
        {
          description: "Premium or Pro ideas, counted without private fields.",
          label: "Premium/Pro Ideas",
          value: metrics.content.premiumProIdeas,
        },
        {
          description: `Ideas updated in the ${recentLabel}.`,
          label: "Recently Updated",
          value: metrics.content.recentlyUpdatedIdeas,
        },
        {
          description: "Ideas with published closed-review visibility.",
          label: "Closed Reviews",
          value: metrics.content.closedReviews,
        },
        {
          description: "All research post records.",
          label: "Research Posts",
          value: metrics.content.researchPosts,
        },
      ],
      title: "Content",
    },
    {
      description:
        "Aggregated member and subscription posture. No private notes or raw user identifiers are shown.",
      icon: Users,
      rows: [
        {
          description: "All profile rows.",
          label: "Total Profiles",
          value: metrics.members.totalProfiles,
        },
        {
          description: "Non-admin profiles without active/trialing paid access.",
          label: "Active Free",
          value: metrics.members.activeFreeSubscriptions,
        },
        {
          description: "Active/trialing Premium subscription rows.",
          label: "Active Premium",
          value: metrics.members.activePremiumSubscriptions,
        },
        {
          description: "Active/trialing Pro subscription rows.",
          label: "Active Pro",
          value: metrics.members.activeProSubscriptions,
        },
        {
          description: `Non-admin profiles created in the ${recentLabel}.`,
          label: "Recent Signups",
          value: metrics.members.recentSignups,
        },
        {
          description: `Safe server-side dashboard/account events in the ${recentLabel}.`,
          label: "Dashboard Activity",
          value: metrics.members.dashboardActivityCount,
        },
      ],
      title: "Members",
    },
    {
      description:
        "Software library and request counts only. No Pine Script/source code, request notes, or usernames are exposed.",
      icon: PackageCheck,
      rows: [
        {
          description: "Published Lite software products.",
          label: "Published Lite",
          value: metrics.software.publishedLiteSoftware,
        },
        {
          description: "Published Pro software products.",
          label: "Published Pro",
          value: metrics.software.publishedProSoftware,
        },
        {
          description: "Requested, needs-info, or approved requests.",
          label: "Open Requests",
          value: metrics.software.openAccessRequests,
        },
        {
          description: "Granted software access requests.",
          label: "Granted",
          value: metrics.software.grantedAccessRequests,
        },
        {
          description: "Revoked or rejected software requests.",
          label: "Revoked/Rejected",
          value: metrics.software.revokedRejectedRequests,
        },
      ],
      title: "Software",
    },
    {
      description:
        "Stripe/Supabase billing sync counts. No financial P&L, card data, revenue, or raw Stripe IDs are shown.",
      icon: CreditCard,
      rows: [
        {
          description: "Active/trialing Premium subscriptions.",
          label: "Active Premium",
          value: metrics.billing.activePremiumCount,
        },
        {
          description: "Active/trialing Pro subscriptions.",
          label: "Active Pro",
          value: metrics.billing.activeProCount,
        },
        {
          description: "Past due subscription rows.",
          label: "Past Due",
          tone: metrics.billing.pastDueCount > 0 ? "warning" : "positive",
          value: metrics.billing.pastDueCount,
        },
        {
          description: "Canceled subscription rows.",
          label: "Canceled",
          value: metrics.billing.canceledCount,
        },
        {
          description: `Checkout sessions created in the ${recentLabel}.`,
          label: "Recent Checkouts",
          value: metrics.billing.recentCheckoutSessions,
        },
        {
          description: "Stripe webhook events marked failed.",
          label: "Webhook Failures",
          tone: metrics.billing.webhookFailures > 0 ? "warning" : "positive",
          value: metrics.billing.webhookFailures,
        },
      ],
      title: "Billing",
    },
    {
      description:
        "Email queue/provider state as counts only. Recipient lists remain in the admin notification center with masking.",
      icon: Mail,
      rows: [
        {
          description: "Queued email notification rows.",
          label: "Queued",
          value: metrics.email.queued,
        },
        {
          description: "Rows marked sent.",
          label: "Sent",
          value: metrics.email.sent,
        },
        {
          description: "Rows marked delivered.",
          label: "Delivered",
          value: metrics.email.delivered,
        },
        {
          description: "Rows marked failed.",
          label: "Failed",
          tone: metrics.email.failed > 0 ? "warning" : "positive",
          value: metrics.email.failed,
        },
        {
          description: "Rows marked bounced.",
          label: "Bounced",
          tone: metrics.email.bounced > 0 ? "warning" : "positive",
          value: metrics.email.bounced,
        },
        {
          description: "Rows marked complained.",
          label: "Complained",
          tone: metrics.email.complained > 0 ? "warning" : "positive",
          value: metrics.email.complained,
        },
        {
          description: "Rows marked suppressed.",
          label: "Suppressed",
          value: metrics.email.suppressed,
        },
        {
          description: "All digest run rows.",
          label: "Digest Runs",
          value: metrics.email.digestRuns,
        },
      ],
      title: "Email",
    },
    {
      description: "Launch-readiness and incident posture for admins.",
      icon: Activity,
      rows: [
        {
          description: "Open incident records.",
          label: "Open Incidents",
          tone: metrics.adminOps.openIncidents > 0 ? "warning" : "positive",
          value: metrics.adminOps.openIncidents,
        },
        {
          description: "Blocking checks not passing or skipped.",
          label: "Blocked Readiness",
          tone:
            metrics.adminOps.blockedReadinessChecks > 0
              ? "warning"
              : "positive",
          value: metrics.adminOps.blockedReadinessChecks,
        },
        {
          description: "All launch-blocking checks.",
          label: "Launch Gates",
          value: metrics.adminOps.launchBlockingChecks,
        },
        {
          description: "Readiness checks in any status.",
          label: "Readiness Checks",
          value: metrics.adminOps.readinessChecks,
        },
      ],
      title: "Admin Ops",
    },
  ];
}

export default async function AdminOpsMetricsPage() {
  await requireAdmin("/admin/ops/metrics");

  const metrics = await getAdminDetailedMetrics();
  const paidAccessCount =
    metrics.billing.activePremiumCount + metrics.billing.activeProCount;
  const opsAttentionCount =
    metrics.adminOps.openIncidents + metrics.adminOps.blockedReadinessChecks;
  const sections = createSections(metrics);

  return (
    <div className="space-y-8">
      <OpsPageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops"
            >
              Operations
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/events"
            >
              Events
            </Link>
          </>
        }
        description="Review high-level operational metrics without exposing private member notes, private research bodies, Stripe IDs, or email recipient lists."
        title="Operations Metrics"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsStatCard
          description="Ideas plus research posts tracked in the CMS."
          icon={FileText}
          label="Content"
          value={String(
            metrics.content.totalIdeas + metrics.content.researchPosts
          )}
        />
        <OpsStatCard
          description="Profiles known to the portal."
          icon={Users}
          label="Profiles"
          value={String(metrics.members.totalProfiles)}
        />
        <OpsStatCard
          description="Active/trialing Premium and Pro subscriptions."
          icon={CreditCard}
          label="Paid Access"
          value={String(paidAccessCount)}
        />
        <OpsStatCard
          description="Open incidents plus blocking readiness checks."
          icon={ShieldAlert}
          label="Ops Attention"
          tone={opsAttentionCount > 0 ? "warning" : "positive"}
          value={String(opsAttentionCount)}
        />
      </section>

      <div className="grid gap-6">
        {sections.map((section) => (
          <MetricSection
            description={section.description}
            icon={section.icon}
            key={section.title}
            rows={section.rows}
            title={section.title}
          />
        ))}
      </div>

      <CardShell padding="md" tone="subtle">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">Privacy Safe</Badge>
            <Badge tone="muted">No P&amp;L</Badge>
            <Badge tone="muted">No Trading Performance</Badge>
            <Badge tone="muted">Aggregate Only</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Metrics are aggregate operational counts. This page intentionally
            excludes trading performance, result claims, P&amp;L, private member
            notes, private content bodies, card data, raw Stripe IDs, and
            unmasked recipient lists.
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Generated {formatMetricDate(metrics.generatedAt)}. Recent activity
            windows use the last {metrics.recentWindowDays} days.
          </p>
        </div>
      </CardShell>
    </div>
  );
}
