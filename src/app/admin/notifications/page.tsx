import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import {
  emailNotificationStatusValues,
  listAdminEmailNotifications,
  maskEmailAddress,
  notificationCategoryValues,
} from "@/lib/email/admin";
import { formatEmailDate, formatNotificationCategory } from "@/lib/email/format";
import { getFeatureFlagState } from "@/lib/flags/server";
import type {
  EmailNotificationStatus,
  NotificationCategory,
} from "@/lib/email/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Notifications",
};

export const dynamic = "force-dynamic";

type AdminNotificationsPageProps = {
  searchParams?: Promise<{
    category?: string | string[];
    date?: string | string[];
    page?: string | string[];
    recipient?: string | string[];
    status?: string | string[];
    template_key?: string | string[];
  }>;
};

const PAGE_SIZE = 25;

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSearch(value?: string | string[]) {
  const query = getFirstParam(value)?.trim().replace(/\s+/g, " ");

  return query ? query.slice(0, 120) : undefined;
}

function parseDate(value?: string | string[]) {
  const firstValue = getFirstParam(value);

  return firstValue && /^\d{4}-\d{2}-\d{2}$/.test(firstValue)
    ? firstValue
    : undefined;
}

function parsePage(value?: string | string[]) {
  const page = Number(getFirstParam(value) ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseEnum<TValue extends string>(
  value: string | string[] | undefined,
  allowedValues: readonly TValue[]
) {
  const firstValue = getFirstParam(value);

  return firstValue && allowedValues.includes(firstValue as TValue)
    ? (firstValue as TValue)
    : undefined;
}

function buildAdminNotificationsHref({
  category,
  date,
  page,
  recipient,
  status,
  templateKey,
}: {
  category?: NotificationCategory;
  date?: string;
  page: number;
  recipient?: string;
  status?: EmailNotificationStatus;
  templateKey?: string;
}) {
  const searchParams = new URLSearchParams();

  if (status) {
    searchParams.set("status", status);
  }

  if (category) {
    searchParams.set("category", category);
  }

  if (recipient) {
    searchParams.set("recipient", recipient);
  }

  if (date) {
    searchParams.set("date", date);
  }

  if (templateKey) {
    searchParams.set("template_key", templateKey);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const queryString = searchParams.toString();

  return queryString ? `/admin/notifications?${queryString}` : "/admin/notifications";
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

  if (status === "failed" || status === "bounced" || status === "complained") {
    return "default" as const;
  }

  return status === "queued" ? ("gold" as const) : ("muted" as const);
}

function SelectFilter({
  children,
  defaultValue,
  label,
  name,
}: {
  children: ReactNode;
  defaultValue: string;
  label: string;
  name: string;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        defaultValue={defaultValue}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

function AdminNotificationFilters({
  category,
  date,
  recipient,
  status,
  templateKey,
}: {
  category?: NotificationCategory;
  date?: string;
  recipient?: string;
  status?: EmailNotificationStatus;
  templateKey?: string;
}) {
  return (
    <CardShell padding="md" tone="subtle">
      <form
        action="/admin/notifications"
        className="grid gap-3 xl:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.45fr)_minmax(9rem,0.45fr)_minmax(9rem,0.4fr)_minmax(10rem,0.5fr)_auto]"
        method="get"
      >
        <label className="relative">
          <span className="sr-only">Filter recipient email</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            defaultValue={recipient ?? ""}
            name="recipient"
            placeholder="Recipient email"
            type="search"
          />
        </label>

        <SelectFilter
          defaultValue={status ?? ""}
          label="Notification status"
          name="status"
        >
          <option value="">All statuses</option>
          {emailNotificationStatusValues.map((value) => (
            <option key={value} value={value}>
              {formatStatus(value)}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter
          defaultValue={category ?? ""}
          label="Notification category"
          name="category"
        >
          <option value="">All categories</option>
          {notificationCategoryValues.map((value) => (
            <option key={value} value={value}>
              {formatNotificationCategory(value)}
            </option>
          ))}
        </SelectFilter>

        <label>
          <span className="sr-only">Queued date</span>
          <input
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            defaultValue={date ?? ""}
            name="date"
            type="date"
          />
        </label>

        <label>
          <span className="sr-only">Template key</span>
          <input
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            defaultValue={templateKey ?? ""}
            name="template_key"
            placeholder="Template key"
            type="search"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
          <button
            className={cn(buttonVariants({ size: "lg", variant: "default" }))}
            type="submit"
          >
            Apply
          </button>
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/admin/notifications"
          >
            Clear
          </Link>
        </div>
      </form>
    </CardShell>
  );
}

export default async function AdminNotificationsPage({
  searchParams,
}: AdminNotificationsPageProps) {
  await requireAdmin("/admin/notifications");

  const params = await searchParams;
  const status = parseEnum(params?.status, emailNotificationStatusValues);
  const category = parseEnum(params?.category, notificationCategoryValues);
  const recipient = parseSearch(params?.recipient);
  const date = parseDate(params?.date);
  const templateKey = parseSearch(params?.template_key);
  const page = parsePage(params?.page);
  const offset = (page - 1) * PAGE_SIZE;
  const emailSendFlag = getFeatureFlagState("production_email_sending_enabled");
  const contentNotifyFlag = getFeatureFlagState(
    "admin_content_email_notify_enabled"
  );
  const digestFlag = getFeatureFlagState("weekly_digest_enabled");
  const notifications = await listAdminEmailNotifications({
    category,
    date,
    limit: PAGE_SIZE,
    offset,
    recipient,
    status,
    templateKey,
  });
  const hasPreviousPage = page > 1;
  const hasNextPage = notifications.count
    ? offset + notifications.items.length < notifications.count
    : notifications.items.length === PAGE_SIZE;
  const previousHref = buildAdminNotificationsHref({
    category,
    date,
    page: page - 1,
    recipient,
    status,
    templateKey,
  });
  const nextHref = buildAdminNotificationsHref({
    category,
    date,
    page: page + 1,
    recipient,
    status,
    templateKey,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href="/admin/notifications/digests"
          >
            Digest Runs
          </Link>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Notifications" },
        ]}
        description="Review queued, sent, failed, and provider-tracked email notifications. This center manages existing notification records only."
        eyebrow="Email"
        title="Notification center"
      />

      <AdminNotificationFilters
        category={category}
        date={date}
        recipient={recipient}
        status={status}
        templateKey={templateKey}
      />

      <CardShell padding="md" tone="subtle">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Email Launch Controls
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              These flags control queueing and provider sends. Access checks,
              preferences, unsubscribes, and suppression still apply.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={contentNotifyFlag.enabled ? "positive" : "muted"}>
              Content Notify {contentNotifyFlag.enabled ? "On" : "Off"}
            </Badge>
            <Badge tone={digestFlag.enabled ? "positive" : "muted"}>
              Weekly Digest {digestFlag.enabled ? "On" : "Off"}
            </Badge>
            <Badge tone={emailSendFlag.enabled ? "positive" : "muted"}>
              Provider Send {emailSendFlag.enabled ? "On" : "Off"}
            </Badge>
          </div>
        </div>
      </CardShell>

      <CardShell padding="none" tone="elevated">
        {notifications.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[76rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Queued</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Retries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notifications.items.map((notification) => (
                  <tr className="align-top" key={notification.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-72 flex-col gap-2">
                        <Link
                          className="line-clamp-2 font-semibold text-foreground transition hover:text-primary"
                          href={`/admin/notifications/${notification.id}`}
                        >
                          {notification.subject ?? "Untitled notification"}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {notification.template_key ?? "No template key"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {maskEmailAddress(notification.recipient_email)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone="muted">
                        {formatNotificationCategory(notification.category)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={statusTone(notification.status)}>
                        {formatStatus(notification.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                      {formatEmailDate(notification.queued_at)}
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                      {formatEmailDate(notification.sent_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-40 flex-col gap-1 text-xs leading-5 text-muted-foreground">
                        <span>{notification.provider ?? "Not sent"}</span>
                        <span className="break-all">
                          {notification.provider_message_id ?? "No message id"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {notification.retry_count}/{notification.max_retries}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <AdminEmptyState
              description="No notifications match the current filters."
              title="No notifications found"
            />
          </div>
        )}
      </CardShell>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page}
          {notifications.count !== null
            ? ` | ${notifications.count} total notifications`
            : null}
        </p>
        <div className="flex gap-2">
          <Link
            aria-disabled={!hasPreviousPage}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              !hasPreviousPage && "pointer-events-none opacity-50"
            )}
            href={hasPreviousPage ? previousHref : "#"}
          >
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Link>
          <Link
            aria-disabled={!hasNextPage}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              !hasNextPage && "pointer-events-none opacity-50"
            )}
            href={hasNextPage ? nextHref : "#"}
          >
            Next
            <ChevronRight data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </div>
  );
}

