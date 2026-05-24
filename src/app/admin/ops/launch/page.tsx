import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  CreditCard,
  FileText,
  HeartPulse,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  MailCheck,
  Scale,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { OpsPageHeader } from "@/components/admin/ops/OpsPageHeader";
import { OpsStatCard } from "@/components/admin/ops/OpsStatCard";
import { ReadinessStatusBadge } from "@/components/admin/ops/ReadinessStatusBadge";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import {
  formatFeatureFlagState,
  getFeatureFlagTone,
} from "@/lib/flags/format";
import { getFeatureFlagState } from "@/lib/flags/server";
import { formatMetricDate, formatOpsCategory } from "@/lib/ops/format";
import { getReadinessSummary, listReadinessChecks } from "@/lib/ops/readiness";
import type { OpsCheckStatus, OpsReadinessCheck } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Launch Readiness",
};

type LaunchSection = {
  description: string;
  icon: LucideIcon;
  keys: string[];
  title: string;
};

const launchSections: LaunchSection[] = [
  {
    description:
      "Production route health, deployment checks, and admin smoke-test evidence.",
    icon: HeartPulse,
    keys: ["production_admin_smoke_tested"],
    title: "App Health",
  },
  {
    description:
      "Login, protected route behavior, admin-only access, and member account flows.",
    icon: LockKeyhole,
    keys: ["production_admin_smoke_tested"],
    title: "Auth",
  },
  {
    description:
      "Premium/pro access enforcement, locked content behavior, and software tier checks.",
    icon: ShieldCheck,
    keys: ["premium_pro_leak_checks_passed", "software_access_model_verified"],
    title: "Content Access",
  },
  {
    description:
      "Live Stripe keys, live webhook, portal, policy, and business approval.",
    icon: CreditCard,
    keys: [
      "live_stripe_keys_configured",
      "live_stripe_webhook_configured",
      "live_stripe_legal_approved",
      "refund_policy_reviewed",
      "pricing_copy_reviewed",
    ],
    title: "Stripe Live Readiness",
  },
  {
    description:
      "Postmark sender/domain, DNS records, legal approval, and send controls.",
    icon: MailCheck,
    keys: [
      "production_email_sender_verified",
      "production_email_spf_dkim_dmarc_reviewed",
      "production_email_legal_approved",
      "production_email_send_enabled_approved",
    ],
    title: "Email Sending Readiness",
  },
  {
    description:
      "Terms, privacy, refund, pricing, subscription, support, and risk language.",
    icon: Scale,
    keys: [
      "pricing_copy_reviewed",
      "refund_policy_reviewed",
      "privacy_policy_reviewed",
      "live_stripe_legal_approved",
      "production_email_legal_approved",
    ],
    title: "Legal/Support",
  },
  {
    description:
      "Project separation, secret handling, key rotation, and access reviews.",
    icon: KeyRound,
    keys: ["production_supabase_project_separated_or_approved"],
    title: "Security/Secrets",
  },
  {
    description:
      "Health endpoints, monitoring posture, event logging, and deploy visibility.",
    icon: Activity,
    keys: ["incident_response_runbook_reviewed"],
    title: "Monitoring",
  },
  {
    description:
      "Supabase backup/restore review and rollback evidence before production launch.",
    icon: ArchiveRestore,
    keys: ["backup_restore_plan_reviewed"],
    title: "Backup/Restore",
  },
  {
    description:
      "Runbook review, escalation flow, and rollback communication plan.",
    icon: LifeBuoy,
    keys: ["incident_response_runbook_reviewed"],
    title: "Incident Response",
  },
];

function statusNeedsAttention(status: OpsCheckStatus) {
  return status !== "passing" && status !== "skipped";
}

function getReadinessByKey(checks: OpsReadinessCheck[]) {
  return new Map(checks.map((check) => [check.key, check]));
}

function getSectionChecks(
  section: LaunchSection,
  checksByKey: Map<string, OpsReadinessCheck>
) {
  return section.keys
    .map((key) => checksByKey.get(key))
    .filter((check): check is OpsReadinessCheck => Boolean(check));
}

function getSectionStatus(checks: OpsReadinessCheck[]) {
  if (checks.length === 0) {
    return "No rows";
  }

  const blockingOpen = checks.some(
    (check) => check.blocking_launch && statusNeedsAttention(check.status)
  );

  if (blockingOpen) {
    return "Blocked";
  }

  const needsReview = checks.some((check) => statusNeedsAttention(check.status));

  return needsReview ? "Review" : "Ready";
}

function getSectionTone(status: string) {
  if (status === "Ready") {
    return "positive" as const;
  }

  return "gold" as const;
}

function isEnvEnabled(name: string) {
  return ["1", "true", "yes", "on"].includes(
    (process.env[name]?.trim() ?? "").toLowerCase()
  );
}

export default async function AdminOpsLaunchPage() {
  await requireAdmin("/admin/ops/launch");

  const [checks, summary] = await Promise.all([
    listReadinessChecks(),
    getReadinessSummary(),
  ]);
  const checksByKey = getReadinessByKey(checks);
  const checkoutFlag = getFeatureFlagState("checkout_enabled");
  const emailSendFlag = getFeatureFlagState(
    "production_email_sending_enabled"
  );
  const digestFlag = getFeatureFlagState("weekly_digest_enabled");
  const emailSendEnvEnabled = isEnvEnabled("EMAIL_SEND_ENABLED");
  const blockingChecks = checks.filter(
    (check) => check.blocking_launch && statusNeedsAttention(check.status)
  );

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
              href="/admin/ops/readiness"
            >
              Readiness
            </Link>
          </>
        }
        description="Review production launch gates, blockers, and operational runbook coverage without enabling live Stripe or production email."
        title="Launch Readiness"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsStatCard
          description="Launch posture from blocking readiness checks."
          icon={summary.launchBlocked ? AlertTriangle : CheckCircle2}
          label="Launch Status"
          tone={summary.launchBlocked ? "warning" : "positive"}
          value={summary.launchBlocked ? "Blocked" : "Ready"}
        />
        <OpsStatCard
          description="Blocking checks not passing or skipped."
          icon={AlertTriangle}
          label="Blocking Checks"
          tone={summary.blockingOpenCount > 0 ? "warning" : "positive"}
          value={String(summary.blockingOpenCount)}
        />
        <OpsStatCard
          description="All tracked readiness checks."
          icon={FileText}
          label="Tracked Checks"
          value={String(summary.total)}
        />
        <OpsStatCard
          description="Live billing and production email are safe-off unless separately approved."
          icon={ShieldCheck}
          label="Safe-Off"
          tone={!emailSendEnvEnabled && !checkoutFlag.enabled ? "positive" : "warning"}
          value={!emailSendEnvEnabled && !checkoutFlag.enabled ? "On" : "Review"}
        />
      </section>

      <CardShell padding="md" tone="subtle">
        <div className="flex gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-gold-300"
          />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Launch Page Is Read-Only for Production Toggles
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              This dashboard summarizes readiness only. It does not enable live
              Stripe subscriptions, production email sending, cron scheduling,
              broker integrations, order execution, copy trading, or automatic
              TradingView invite automation.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={getFeatureFlagTone(checkoutFlag)}>
                Checkout {formatFeatureFlagState(checkoutFlag)}
              </Badge>
              <Badge tone={getFeatureFlagTone(emailSendFlag)}>
                Production Email {formatFeatureFlagState(emailSendFlag)}
              </Badge>
              <Badge tone={getFeatureFlagTone(digestFlag)}>
                Weekly Digest {formatFeatureFlagState(digestFlag)}
              </Badge>
              <Badge tone={emailSendEnvEnabled ? "gold" : "positive"}>
                EMAIL_SEND_ENABLED {emailSendEnvEnabled ? "enabled" : "safe-off"}
              </Badge>
            </div>
          </div>
        </div>
      </CardShell>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Blocking Checks
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            These checks must be passing or intentionally skipped before launch
            is considered clear.
          </p>
        </div>
        {blockingChecks.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {blockingChecks.map((check) => (
              <CardShell key={check.id} padding="md" tone="default">
                <div className="flex flex-wrap items-center gap-2">
                  <ReadinessStatusBadge status={check.status} />
                  <span className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground">
                    {formatOpsCategory(check.category)}
                  </span>
                  <span className="rounded-md border border-gold-400/25 bg-gold-400/10 px-2 py-1 text-xs text-gold-200">
                    Blocks launch
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">
                  {check.title}
                </h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {check.key}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {check.evidence_note || check.description || "No evidence note yet."}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Last checked: {formatMetricDate(check.last_checked_at)}
                </p>
              </CardShell>
            ))}
          </div>
        ) : (
          <CardShell padding="md" tone="elevated">
            <div className="flex items-start gap-3">
              <CheckCircle2
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-positive"
              />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  No Open Blocking Checks
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Blocking readiness rows are currently passing or intentionally
                  skipped. Keep legal, live billing, and production email caveats
                  explicit until separately approved.
                </p>
              </div>
            </div>
          </CardShell>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Launch Sections
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Each section rolls up existing readiness rows. Missing rows are
            shown as informational gaps, not as approval.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {launchSections.map((section) => {
            const sectionChecks = getSectionChecks(section, checksByKey);
            const sectionStatus = getSectionStatus(sectionChecks);
            const Icon = section.icon;

            return (
              <CardShell key={section.title} padding="md" tone="default">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground">
                        <Icon aria-hidden="true" className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {section.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <Badge tone={getSectionTone(sectionStatus)}>
                      {sectionStatus}
                    </Badge>
                  </div>

                  {sectionChecks.length > 0 ? (
                    <div className="space-y-3">
                      {sectionChecks.map((check) => (
                        <div
                          className="rounded-lg border border-border bg-background/60 p-3"
                          key={`${section.title}-${check.key}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {check.title}
                            </p>
                            <ReadinessStatusBadge status={check.status} />
                          </div>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {check.key}
                          </p>
                          {check.evidence_note ? (
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {check.evidence_note}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-border bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                      No readiness rows are currently mapped to this section.
                      Add evidence in the readiness dashboard before treating
                      this area as launch-ready.
                    </p>
                  )}
                </div>
              </CardShell>
            );
          })}
        </div>
      </section>

      <CardShell padding="md" tone="subtle">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Runbook Coverage
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Operational runbooks live in `docs/runbooks/` and cover production
            launch, incident response, Stripe live readiness, email production
            readiness, and secret rotation. They are guidance documents only and
            do not change runtime settings.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="muted">No live billing enablement</Badge>
            <Badge tone="muted">No production email enablement</Badge>
            <Badge tone="muted">No broker/order/copy trading</Badge>
          </div>
        </div>
      </CardShell>
    </div>
  );
}
