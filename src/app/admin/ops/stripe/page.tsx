import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CreditCard, ExternalLink, ShieldCheck } from "lucide-react";

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
import { listReadinessChecks } from "@/lib/ops/readiness";
import { opsCheckStatusValues, type OpsReadinessCheck } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stripe Live Readiness",
};

type StripeReadinessItem = {
  description: string;
  key: string;
  label: string;
  ready: boolean;
  source: "environment" | "feature_flag" | "readiness";
  warning?: string;
};

const READINESS_KEYS = [
  "live_stripe_keys_configured",
  "live_stripe_webhook_configured",
  "live_stripe_legal_approved",
  "production_supabase_project_separated_or_approved",
  "refund_policy_reviewed",
  "pricing_copy_reviewed",
  "privacy_policy_reviewed",
] as const;

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function getReadinessByKey(checks: OpsReadinessCheck[]) {
  return new Map(checks.map((check) => [check.key, check]));
}

function isPassing(check: OpsReadinessCheck | undefined) {
  return check?.status === "passing" || check?.status === "skipped";
}

function StatusPill({
  ready,
  source,
}: {
  ready: boolean;
  source: StripeReadinessItem["source"];
}) {
  return (
    <Badge tone={ready ? "positive" : "gold"}>
      {ready ? "Ready" : source === "feature_flag" ? "Off" : "Needs review"}
    </Badge>
  );
}

function ReadinessUpdateForm({ check }: { check: OpsReadinessCheck }) {
  return (
    <form
      action={updateReadinessCheckAction}
      className="space-y-3 rounded-lg border border-border bg-background/60 p-4"
    >
      <input name="id" type="hidden" value={check.id} />
      <input name="return_to" type="hidden" value="/admin/ops/stripe" />
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
          placeholder="Safe evidence summary; no secret values"
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

export default async function AdminOpsStripePage() {
  await requireAdmin("/admin/ops/stripe");

  const checks = await listReadinessChecks();
  const readinessByKey = getReadinessByKey(checks);
  const checkoutFlag = getFeatureFlagState("checkout_enabled");
  const portalFlag = getFeatureFlagState("customer_portal_enabled");
  const readinessItems: StripeReadinessItem[] = [
    {
      description: "Server-side live Stripe secret presence only; value hidden.",
      key: "STRIPE_SECRET_KEY",
      label: "Live Stripe secret configured",
      ready: hasEnv("STRIPE_SECRET_KEY"),
      source: "environment",
      warning:
        "Presence does not prove live-mode approval. Confirm test/live mode outside this page.",
    },
    {
      description: "Premium monthly price env is present; value hidden.",
      key: "STRIPE_PREMIUM_MONTHLY_PRICE_ID",
      label: "Live Premium monthly price configured",
      ready: hasEnv("STRIPE_PREMIUM_MONTHLY_PRICE_ID"),
      source: "environment",
    },
    {
      description: "Premium annual price env is present; value hidden.",
      key: "STRIPE_PREMIUM_ANNUAL_PRICE_ID",
      label: "Live Premium annual price configured",
      ready: hasEnv("STRIPE_PREMIUM_ANNUAL_PRICE_ID"),
      source: "environment",
    },
    {
      description: "Pro monthly price env is present; value hidden.",
      key: "STRIPE_PRO_MONTHLY_PRICE_ID",
      label: "Live Pro monthly price configured",
      ready: hasEnv("STRIPE_PRO_MONTHLY_PRICE_ID"),
      source: "environment",
    },
    {
      description: "Pro annual price env is present; value hidden.",
      key: "STRIPE_PRO_ANNUAL_PRICE_ID",
      label: "Live Pro annual price configured",
      ready: hasEnv("STRIPE_PRO_ANNUAL_PRICE_ID"),
      source: "environment",
    },
    {
      description: "Webhook signing secret presence only; value hidden.",
      key: "STRIPE_WEBHOOK_SECRET",
      label: "Live webhook secret configured",
      ready: hasEnv("STRIPE_WEBHOOK_SECRET"),
      source: "environment",
    },
    {
      description: "Customer Portal launch-control flag state.",
      key: "customer_portal_enabled",
      label: "Customer Portal live configured",
      ready: portalFlag.enabled,
      source: "feature_flag",
    },
    {
      description: "Checkout launch-control flag state.",
      key: "checkout_enabled",
      label: "Checkout enabled flag",
      ready: checkoutFlag.enabled,
      source: "feature_flag",
    },
    {
      description: "Readiness row for refund policy review.",
      key: "refund_policy_reviewed",
      label: "Refund policy reviewed",
      ready: isPassing(readinessByKey.get("refund_policy_reviewed")),
      source: "readiness",
    },
    {
      description: "Readiness row for cancellation/pricing copy review.",
      key: "pricing_copy_reviewed",
      label: "Cancellation policy reviewed",
      ready: isPassing(readinessByKey.get("pricing_copy_reviewed")),
      source: "readiness",
    },
    {
      description: "Readiness row for live Stripe legal/business approval.",
      key: "live_stripe_legal_approved",
      label: "Tax/legal review complete",
      ready: isPassing(readinessByKey.get("live_stripe_legal_approved")),
      source: "readiness",
    },
    {
      description: "Production Supabase project separation or approval.",
      key: "production_supabase_project_separated_or_approved",
      label: "Production Supabase project approved",
      ready: isPassing(
        readinessByKey.get("production_supabase_project_separated_or_approved")
      ),
      source: "readiness",
    },
  ];
  const readyCount = readinessItems.filter((item) => item.ready).length;
  const readinessChecks = READINESS_KEYS.map((key) => readinessByKey.get(key))
    .filter((check): check is OpsReadinessCheck => Boolean(check));

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
        description="Review live Stripe launch posture without enabling billing, creating sessions, or mutating subscriptions."
        title="Stripe Live Readiness"
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
                Ready signals across env presence, feature flags, and manual
                readiness rows.
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-md border border-gold-400/25 bg-gold-400/10 text-gold-300">
              <CreditCard aria-hidden="true" className="size-5" />
            </div>
          </div>
        </CardShell>
        <CardShell padding="md" tone="elevated">
          <div className="space-y-3">
            <Badge tone={getFeatureFlagTone(checkoutFlag)}>
              Checkout {formatFeatureFlagState(checkoutFlag)}
            </Badge>
            <p className="text-sm leading-6 text-muted-foreground">
              `{checkoutFlag.sourceEnvVar}` is an operational kill switch only.
              It cannot grant access or bypass webhook subscription sync.
            </p>
          </div>
        </CardShell>
        <CardShell padding="md" tone="elevated">
          <div className="space-y-3">
            <Badge tone={getFeatureFlagTone(portalFlag)}>
              Portal {formatFeatureFlagState(portalFlag)}
            </Badge>
            <p className="text-sm leading-6 text-muted-foreground">
              Customer Portal readiness does not enable live subscriptions by
              itself and does not alter Supabase subscription state.
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
              Live Billing Requires Separate Approval
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Deploy-preview/test-mode QA is not the same as live billing
              approval. Live Stripe keys, live prices, tax/legal review,
              cancellation/refund policy review, and business approval must be
              completed outside this page before live billing is enabled.
            </p>
          </div>
        </div>
      </CardShell>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Readiness Checklist
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Values are shown as presence/status only. Secret and price values are
            never displayed.
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
                <StatusPill ready={item.ready} source={item.source} />
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
              Admins can update status, owner, and safe evidence notes here. This
              page intentionally cannot enable live billing or create Checkout
              sessions.
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
              External Live Stripe Verification
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Confirm live products, prices, Customer Portal, webhook endpoint,
              taxes, refunds, and cancellation policy in Stripe Dashboard before
              enabling billing flags.
            </p>
          </div>
          <a
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="https://dashboard.stripe.com/"
            rel="noreferrer"
            target="_blank"
          >
            Stripe Dashboard
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      </CardShell>
    </div>
  );
}
