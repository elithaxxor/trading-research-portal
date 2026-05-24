import type { Metadata } from "next";
import Link from "next/link";

import {
  triggerWeeklyDigestDryRunAction,
  triggerWeeklyDigestQueueAction,
} from "@/app/admin/notifications/actions";
import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCheckbox } from "@/components/admin/forms/AdminCheckbox";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { formatEmailDate } from "@/lib/email/format";
import { listAdminEmailDigestRuns } from "@/lib/email/admin";
import { isFeatureEnabled } from "@/lib/flags/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Email Digest Runs",
};

export const dynamic = "force-dynamic";

type AdminDigestRunsPageProps = {
  searchParams?: Promise<{
    failed?: string | string[];
    notice?: string | string[];
    queued?: string | string[];
    skipped?: string | string[];
    total?: string | string[];
    withItems?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCount(value?: string | string[]) {
  const count = Number(getFirstParam(value));

  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
}

function getNotice(
  params: Awaited<AdminDigestRunsPageProps["searchParams"]> | undefined
) {
  const notice = getFirstParam(params?.notice);

  if (notice === "dry_run") {
    return {
      message: `Dry run complete. Eligible: ${parseCount(
        params?.total
      )}; with items: ${parseCount(params?.withItems)}; skipped: ${parseCount(
        params?.skipped
      )}; failed: ${parseCount(params?.failed)}.`,
      tone: "success" as const,
    };
  }

  if (notice === "queued") {
    return {
      message: `Digest queueing complete. Eligible: ${parseCount(
        params?.total
      )}; queued: ${parseCount(params?.queued)}; skipped: ${parseCount(
        params?.skipped
      )}; failed: ${parseCount(params?.failed)}.`,
      tone: "success" as const,
    };
  }

  if (notice === "missing_confirmation") {
    return {
      message:
        "Digest queueing was not started because the explicit confirmation checkbox was not selected.",
      tone: "error" as const,
    };
  }

  if (notice === "queue_failed") {
    return {
      message: "Digest queueing failed. Check server logs for safe error context.",
      tone: "error" as const,
    };
  }

  if (notice === "digest_disabled") {
    return {
      message:
        "Weekly digest queueing is disabled by launch controls. Dry-runs remain available.",
      tone: "error" as const,
    };
  }

  return null;
}

function statusTone(status: string) {
  if (status === "completed") {
    return "positive" as const;
  }

  if (status === "started") {
    return "gold" as const;
  }

  return status.includes("error") ? ("default" as const) : ("muted" as const);
}

export default async function AdminDigestRunsPage({
  searchParams,
}: AdminDigestRunsPageProps) {
  await requireAdmin("/admin/notifications/digests");

  const params = await searchParams;
  const notice = getNotice(params);
  const runs = await listAdminEmailDigestRuns();
  const weeklyDigestEnabled = isFeatureEnabled("weekly_digest_enabled");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href="/admin/notifications"
          >
            All Notifications
          </Link>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/notifications", label: "Notifications" },
          { label: "Digests" },
        ]}
        description="Review weekly digest run history and trigger controlled digest dry-runs or queueing. Queueing respects member access, preferences, and unsubscribe state."
        eyebrow="Email"
        title="Weekly digest runs"
      />

      {notice ? <AuthNotice message={notice.message} tone={notice.tone} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <CardShell padding="md" tone="subtle">
          <form action={triggerWeeklyDigestDryRunAction} className="space-y-5">
            <div className="space-y-2">
              <Badge tone="muted">Dry Run</Badge>
              <h2 className="text-xl font-semibold text-foreground">
                Estimate digest recipients
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Dry runs inspect eligible users and digest items without creating
                notification queue rows.
              </p>
            </div>
            <DigestWindowFields />
            <button
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              type="submit"
            >
              Run Dry-Run
            </button>
          </form>
        </CardShell>

        <CardShell padding="md" tone="elevated">
          <form action={triggerWeeklyDigestQueueAction} className="space-y-5">
            <div className="space-y-2">
              <Badge tone="gold">Queue Only</Badge>
              <h2 className="text-xl font-semibold text-foreground">
                Queue weekly digest
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                This creates digest notification rows. It does not send emails
                until the protected queue processor runs.
              </p>
              {!weeklyDigestEnabled ? (
                <p className="rounded-lg border border-gold-400/25 bg-gold-400/10 px-3 py-2 text-sm leading-6 text-gold-100">
                  Weekly digest queueing is disabled by launch controls.
                </p>
              ) : null}
            </div>
            <DigestWindowFields />
            <AdminCheckbox
              description="Required so digest queueing is always deliberate."
              id="confirm_digest_queue"
              label="I confirm queueing a weekly digest for eligible members."
              name="confirm_digest_queue"
              value="yes"
            />
            <button
              className={cn(
                buttonVariants({ size: "lg", variant: "default" }),
                !weeklyDigestEnabled && "cursor-not-allowed opacity-50"
              )}
              disabled={!weeklyDigestEnabled}
              type="submit"
            >
              Queue Digest
            </button>
          </form>
        </CardShell>
      </div>

      <CardShell padding="none" tone="elevated">
        {runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[66rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Run</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Recipients</th>
                  <th className="px-4 py-3 font-medium">Counts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run) => (
                  <tr className="align-top" key={run.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-72 flex-col gap-1">
                        <span className="break-all font-medium text-foreground">
                          {run.run_key}
                        </span>
                        {run.error ? (
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {run.error}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                      {formatEmailDate(run.started_at)}
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                      {formatEmailDate(run.completed_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {run.recipient_count}
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid min-w-56 grid-cols-3 gap-2 text-xs leading-5 text-muted-foreground">
                        <span>Sent {run.sent_count}</span>
                        <span>Skipped {run.skipped_count}</span>
                        <span>Failed {run.failed_count}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <AdminEmptyState
              description="Weekly digest runs will appear after an admin or protected scheduler triggers digest queueing."
              title="No digest runs yet"
            />
          </div>
        )}
      </CardShell>
    </div>
  );
}

function DigestWindowFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <AdminTextInput
        description="Defaults to seven days ago."
        id="digest-since"
        label="Since"
        name="since"
        type="datetime-local"
      />
      <AdminTextInput
        description="Defaults to now."
        id="digest-until"
        label="Until"
        name="until"
        type="datetime-local"
      />
      <AdminTextInput
        description="Optional cap for QA."
        id="digest-limit"
        label="Recipient limit"
        min={1}
        name="limit"
        type="number"
      />
    </div>
  );
}
