import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, XCircle } from "lucide-react";

import {
  cancelEmailNotificationAction,
  retryEmailNotificationAction,
} from "@/app/admin/notifications/actions";
import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import {
  createAdminSafeEmailBodyPreview,
  getAdminEmailNotificationById,
  listAdminEmailProviderEvents,
  maskEmailAddress,
  redactSensitiveJson,
} from "@/lib/email/admin";
import { formatEmailDate, formatNotificationCategory } from "@/lib/email/format";
import type { EmailNotificationStatus } from "@/lib/email/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Notification Detail",
};

export const dynamic = "force-dynamic";

type AdminNotificationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseNotice(value?: string | string[]) {
  const notice = getFirstParam(value);

  if (notice === "retried") {
    return "Notification queued for retry.";
  }

  if (notice === "canceled") {
    return "Queued notification canceled.";
  }

  return null;
}

function formatStatus(status: EmailNotificationStatus) {
  return status
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: EmailNotificationStatus) {
  if (status === "delivered" || status === "sent") {
    return "positive" as const;
  }

  if (status === "queued") {
    return "gold" as const;
  }

  return "muted" as const;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm leading-6 text-foreground">
        {value ?? "Not recorded"}
      </p>
    </div>
  );
}

export default async function AdminNotificationDetailPage({
  params,
  searchParams,
}: AdminNotificationDetailPageProps) {
  await requireAdmin("/admin/notifications");

  const { id } = await params;
  const notification = await getAdminEmailNotificationById(id);

  if (!notification) {
    notFound();
  }

  const urlParams = await searchParams;
  const notice = parseNotice(urlParams?.notice);
  const providerEvents = await listAdminEmailProviderEvents(
    notification.id,
    notification.provider_message_id
  );
  const bodyPreview = createAdminSafeEmailBodyPreview(notification);
  const canRetry =
    notification.status === "failed" || notification.status === "queued";
  const canCancel = notification.status === "queued";

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            {canRetry ? (
              <form action={retryEmailNotificationAction}>
                <input
                  name="notification_id"
                  type="hidden"
                  value={notification.id}
                />
                <button
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  type="submit"
                >
                  <RotateCcw data-icon="inline-start" />
                  Retry
                </button>
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancelEmailNotificationAction}>
                <input
                  name="notification_id"
                  type="hidden"
                  value={notification.id}
                />
                <button
                  className={cn(
                    buttonVariants({ size: "sm", variant: "destructive" })
                  )}
                  type="submit"
                >
                  <XCircle data-icon="inline-start" />
                  Cancel
                </button>
              </form>
            ) : null}
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              href="/admin/notifications"
            >
              All Notifications
            </Link>
          </div>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/notifications", label: "Notifications" },
          { label: "Detail" },
        ]}
        description="Inspect notification metadata, safe body preview, provider events, and queue controls. This page does not send arbitrary custom emails."
        eyebrow="Email"
        title={notification.subject ?? "Notification detail"}
      />

      {notice ? <AuthNotice message={notice} tone="success" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <CardShell padding="md" tone="elevated">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(notification.status)}>
                {formatStatus(notification.status)}
              </Badge>
              <Badge tone="muted">
                {formatNotificationCategory(notification.category)}
              </Badge>
              {notification.unsubscribe_group ? (
                <Badge tone="muted">{notification.unsubscribe_group}</Badge>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Recipient"
                value={maskEmailAddress(notification.recipient_email)}
              />
              <DetailItem label="Template" value={notification.template_key} />
              <DetailItem label="Queued" value={formatEmailDate(notification.queued_at)} />
              <DetailItem label="Send after" value={formatEmailDate(notification.send_after)} />
              <DetailItem label="Sent" value={formatEmailDate(notification.sent_at)} />
              <DetailItem
                label="Delivered"
                value={formatEmailDate(notification.delivered_at)}
              />
              <DetailItem label="Provider" value={notification.provider} />
              <DetailItem
                label="Provider message id"
                value={notification.provider_message_id}
              />
              <DetailItem
                label="Retry count"
                value={`${notification.retry_count}/${notification.max_retries}`}
              />
              <DetailItem label="Dedupe key" value={notification.dedupe_key} />
            </div>

            {notification.last_error ? (
              <AuthNotice
                message={notification.last_error}
                tone={notification.status === "failed" ? "error" : "info"}
              />
            ) : null}
          </div>
        </CardShell>

        <CardShell padding="md" tone="subtle">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Safe body preview
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {bodyPreview.hidden
                  ? "Preview hidden."
                  : bodyPreview.preview || "No body preview recorded."}
              </p>
            </div>
            {bodyPreview.hidden ? (
              <AuthNotice message={bodyPreview.preview} tone="info" />
            ) : null}
          </div>
        </CardShell>
      </div>

      <CardShell padding="md" tone="elevated">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Metadata</h2>
          <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-background/75 p-4 text-xs leading-5 text-muted-foreground">
            {JSON.stringify(redactSensitiveJson(notification.metadata), null, 2)}
          </pre>
        </div>
      </CardShell>

      <CardShell padding="none" tone="elevated">
        {providerEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {providerEvents.map((event) => (
                  <tr className="align-top" key={event.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-48 flex-col gap-1">
                        <span className="font-medium text-foreground">
                          {event.event_type}
                        </span>
                        <span className="break-all text-xs text-muted-foreground">
                          {event.provider_event_id ?? "No provider event id"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                      {formatEmailDate(event.received_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {event.provider}
                    </td>
                    <td className="px-4 py-4">
                      <span className="block max-w-xs break-all text-xs leading-5 text-muted-foreground">
                        {event.provider_message_id ?? "No message id"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {maskEmailAddress(event.recipient_email)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <AdminEmptyState
              description="Provider webhook events will appear after Resend reports delivery, bounce, complaint, or engagement status for this message."
              title="No provider events"
            />
          </div>
        )}
      </CardShell>
    </div>
  );
}
