import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ExternalLink,
  MailCheck,
  Send,
  ShieldCheck,
} from "lucide-react";

import { updateReadinessCheckAction } from "@/app/admin/ops/actions";
import { OpsPageHeader } from "@/components/admin/ops/OpsPageHeader";
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
import { getEmailMetrics } from "@/lib/ops/metrics";
import { listReadinessChecks } from "@/lib/ops/readiness";
import { opsCheckStatusValues, type OpsReadinessCheck } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email Production Readiness",
};

type EmailReadinessItem = {
  description: string;
  key: string;
  label: string;
  ready: boolean;
  source: "environment" | "feature_flag" | "readiness";
  statusLabel?: string;
  warning?: string;
};

const EMAIL_READINESS_KEYS = [
  "production_email_sender_verified",
  "production_email_spf_dkim_dmarc_reviewed",
  "production_email_legal_approved",
  "production_email_send_enabled_approved",
  "privacy_policy_reviewed",
  "incident_response_runbook_reviewed",
] as const;

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function isEnabledEnv(name: string) {
  return ["1", "true", "yes", "on"].includes(
    (process.env[name]?.trim() ?? "").toLowerCase()
  );
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

function getReadinessByKey(checks: OpsReadinessCheck[]) {
  return new Map(checks.map((check) => [check.key, check]));
}

function isPassing(check: OpsReadinessCheck | undefined) {
  return check?.status === "passing" || check?.status === "skipped";
}

function StatusPill({
  item,
}: {
  item: EmailReadinessItem;
}) {
  return (
    <Badge tone={item.ready ? "positive" : "gold"}>
      {item.statusLabel ??
        (item.ready
          ? "Ready"
          : item.source === "feature_flag"
            ? "Off"
            : "Needs review")}
    </Badge>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <CardShell padding="md" tone="elevated">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
      </div>
    </CardShell>
  );
}

function ReadinessUpdateForm({ check }: { check: OpsReadinessCheck }) {
  return (
    <form
      action={updateReadinessCheckAction}
      className="space-y-3 rounded-lg border border-border bg-background/60 p-4"
    >
      <input name="id" type="hidden" value={check.id} />
      <input name="return_to" type="hidden" value="/admin/ops/email" />
      <div className="flex flex-wrap items-center gap-2">
        <ReadinessStatusBadge status={check.status} />
        <span className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground">
          {formatOpsCategory(check.category)}
        </span>
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {check.title}
        </h3>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {check.key}
        </p>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Status</span>
        <select
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          defaultValue={check.status}
          name="status"
        >
          {opsCheckStatusValues.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Owner</span>
        <input
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          defaultValue={check.owner ?? ""}
          name="owner"
          placeholder="Owner or team"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Evidence Note
        </span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          defaultValue={check.evidence_note ?? ""}
          name="evidence_note"
          placeholder="Safe evidence summary; no secrets or recipient data"
        />
      </label>
      <button
        className={cn(buttonVariants({ size: "lg", variant: "default" }), "w-full")}
        type="submit"
      >
        Save Readiness Note
      </button>
      <p className="text-xs leading-5 text-muted-foreground">
        Last checked: {formatMetricDate(check.last_checked_at)}
      </p>
    </form>
  );
}

export default async function AdminOpsEmailPage() {
  await requireAdmin("/admin/ops/email");

  const [checks, emailMetrics] = await Promise.all([
    listReadinessChecks(),
    getEmailMetrics(),
  ]);
  const readinessByKey = getReadinessByKey(checks);
  const productionSendFlag = getFeatureFlagState(
    "production_email_sending_enabled"
  );
  const weeklyDigestFlag = getFeatureFlagState("weekly_digest_enabled");
  const contentNotifyFlag = getFeatureFlagState(
    "admin_content_email_notify_enabled"
  );
  const emailSendEnabled = isEnabledEnv("EMAIL_SEND_ENABLED");
  const senderVerified = readinessByKey.get("production_email_sender_verified");
  const dnsReviewed = readinessByKey.get(
    "production_email_spf_dkim_dmarc_reviewed"
  );
  const legalApproved = readinessByKey.get("production_email_legal_approved");
  const sendApproved = readinessByKey.get(
    "production_email_send_enabled_approved"
  );
  const supportReviewed = readinessByKey.get(
    "incident_response_runbook_reviewed"
  );
  const privacyReviewed = readinessByKey.get("privacy_policy_reviewed");
  const readinessItems: EmailReadinessItem[] = [
    {
      description:
        "Production send env posture. For readiness review this should remain disabled until explicit approval.",
      key: "EMAIL_SEND_ENABLED",
      label: "EMAIL_SEND_ENABLED production state",
      ready: !emailSendEnabled,
      source: "environment",
      statusLabel: emailSendEnabled ? "Enabled" : "Safe-off",
      warning: emailSendEnabled
        ? "Production sending appears enabled. Confirm this is explicitly approved."
        : "Safe-off; no production email should send from this env state.",
    },
    {
      description:
        "Provider sender/domain verification readiness row; values are not displayed.",
      key: "production_email_sender_verified",
      label: "Postmark sender/domain verified",
      ready: isPassing(senderVerified),
      source: "readiness",
    },
    {
      description: "Uses the SPF/DKIM/DMARC composite readiness row.",
      key: "spf_configured",
      label: "SPF configured",
      ready: isPassing(dnsReviewed),
      source: "readiness",
    },
    {
      description: "Uses the SPF/DKIM/DMARC composite readiness row.",
      key: "dkim_configured",
      label: "DKIM configured",
      ready: isPassing(dnsReviewed),
      source: "readiness",
    },
    {
      description: "Uses the SPF/DKIM/DMARC composite readiness row.",
      key: "dmarc_reviewed",
      label: "DMARC reviewed",
      ready: isPassing(dnsReviewed),
      source: "readiness",
    },
    {
      description:
        "EMAIL_FROM must be present and covered by sender/domain approval.",
      key: "EMAIL_FROM",
      label: "EMAIL_FROM approved",
      ready: hasEnv("EMAIL_FROM") && isPassing(senderVerified),
      source: "environment",
    },
    {
      description:
        "EMAIL_REPLY_TO must be present and covered by legal/support approval.",
      key: "EMAIL_REPLY_TO",
      label: "EMAIL_REPLY_TO approved",
      ready: hasEnv("EMAIL_REPLY_TO") && isPassing(legalApproved),
      source: "environment",
    },
    {
      description:
        "Cron secret presence check only; the value is never displayed.",
      key: "EMAIL_CRON_SECRET",
      label: "EMAIL_CRON_SECRET configured",
      ready: hasEnv("EMAIL_CRON_SECRET"),
      source: "environment",
    },
    {
      description:
        "Manual approval before any queue/digest scheduler is configured.",
      key: "production_email_send_enabled_approved",
      label: "Queue/digest scheduler approved",
      ready: isPassing(sendApproved),
      source: "readiness",
    },
    {
      description:
        "Legal/business review must cover preference and unsubscribe behavior.",
      key: "unsubscribe_flow_reviewed",
      label: "Unsubscribe flow reviewed",
      ready: isPassing(legalApproved) && isPassing(privacyReviewed),
      source: "readiness",
    },
    {
      description:
        "Support process readiness uses the incident/support runbook row.",
      key: "support_process_reviewed",
      label: "Support process reviewed",
      ready: isPassing(supportReviewed),
      source: "readiness",
    },
    {
      description:
        "Explicit legal/business approval before production email sends.",
      key: "production_email_legal_approved",
      label: "Legal/business approval complete",
      ready: isPassing(legalApproved),
      source: "readiness",
    },
  ];
  const readyCount = readinessItems.filter((item) => item.ready).length;
  const readinessChecks = EMAIL_READINESS_KEYS.map((key) =>
    readinessByKey.get(key)
  ).filter((check): check is OpsReadinessCheck => Boolean(check));
  const queuedCount = bucketCount(emailMetrics.notificationsByStatus, "queued");
  const sentCount = bucketCount(emailMetrics.notificationsByStatus, "sent");
  const deliveredCount = bucketCount(
    emailMetrics.notificationsByStatus,
    "delivered"
  );
  const bouncedCount = bucketCount(
    emailMetrics.notificationsByStatus,
    "bounced"
  );
  const complainedCount = bucketCount(
    emailMetrics.notificationsByStatus,
    "complained"
  );
  const suppressedCount = bucketCount(
    emailMetrics.notificationsByStatus,
    "suppressed"
  );
  const failedCount = bucketCount(emailMetrics.notificationsByStatus, "failed");
  const digestRunsCount = bucketTotal(emailMetrics.digestRunsByStatus);

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
              href="/admin/notifications"
            >
              Notification Center
            </Link>
          </>
        }
        description="Review production email launch posture without enabling sends, scheduling cron, or exposing recipient data."
        title="Email Production Readiness"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <CardShell padding="md" tone="elevated">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Checklist
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {readyCount}/{readinessItems.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ready signals across env presence, launch controls, and manual
                readiness notes.
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-md border border-gold-400/25 bg-gold-400/10 text-gold-300">
              <MailCheck aria-hidden="true" className="size-5" />
            </div>
          </div>
        </CardShell>
        <CardShell padding="md" tone="elevated">
          <div className="space-y-3">
            <Badge tone={getFeatureFlagTone(productionSendFlag)}>
              Provider Send {formatFeatureFlagState(productionSendFlag)}
            </Badge>
            <p className="text-sm leading-6 text-muted-foreground">
              Provider sends require both this flag and `EMAIL_SEND_ENABLED`.
              This page cannot change either value.
            </p>
          </div>
        </CardShell>
        <CardShell padding="md" tone="elevated">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone={getFeatureFlagTone(contentNotifyFlag)}>
                Content {formatFeatureFlagState(contentNotifyFlag)}
              </Badge>
              <Badge tone={getFeatureFlagTone(weeklyDigestFlag)}>
                Digest {formatFeatureFlagState(weeklyDigestFlag)}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              These controls affect queueing only. Preferences, unsubscribe
              records, suppression, and access eligibility still apply.
            </p>
          </div>
        </CardShell>
      </section>

      <CardShell padding="md" tone="subtle">
        <div className="flex gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-gold-300"
          />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Production Email Remains Safe-Off
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              This dashboard does not send email, enable cron, expose recipient
              lists, or modify provider settings. Production email requires
              sender/domain verification, SPF/DKIM/DMARC review, unsubscribe and
              support workflow review, legal/business approval, and explicit
              send approval.
            </p>
          </div>
        </div>
      </CardShell>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Email Metrics
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Aggregate counts only; recipient addresses and payloads are not shown.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Queued" value={queuedCount} />
          <MetricTile label="Sent" value={sentCount} />
          <MetricTile label="Delivered" value={deliveredCount} />
          <MetricTile label="Bounced" value={bouncedCount} />
          <MetricTile label="Complained" value={complainedCount} />
          <MetricTile label="Suppressed" value={suppressedCount} />
          <MetricTile label="Failed" value={failedCount} />
          <MetricTile label="Digest Runs" value={digestRunsCount} />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Production Readiness Checklist
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Status is derived from environment presence, feature flags, and
            readiness notes. Values and secrets are never displayed.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {readinessItems.map((item) => (
            <CardShell key={item.key} padding="md" tone="default">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Source: {item.source}
                  </p>
                  {item.warning ? (
                    <p className="mt-2 text-xs leading-5 text-gold-100">
                      {item.warning}
                    </p>
                  ) : null}
                </div>
                <StatusPill item={item} />
              </div>
            </CardShell>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-positive"
          />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Manual Readiness Notes
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Admins can update status, owner, and safe evidence notes only.
              Never paste recipient lists, provider tokens, webhook credentials,
              or SMTP/DNS secret values.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {readinessChecks.map((check) => (
            <ReadinessUpdateForm check={check} key={check.id} />
          ))}
        </div>
      </section>

      <CardShell padding="md" tone="subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Provider Verification
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Confirm Postmark sender/domain verification, SPF, DKIM, DMARC,
              activity logs, bounce handling, and complaint handling in the
              provider dashboard before approving production sends.
            </p>
          </div>
          <a
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="https://account.postmarkapp.com/"
            rel="noreferrer"
            target="_blank"
          >
            Postmark Dashboard
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      </CardShell>

      <p className="text-xs leading-5 text-muted-foreground">
        <Send aria-hidden="true" className="mr-1 inline size-3" />
        No send, scheduler, cron, SMS, or push notification controls are present
        on this page.
      </p>
    </div>
  );
}
