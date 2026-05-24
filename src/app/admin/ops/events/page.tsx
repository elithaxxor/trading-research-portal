import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { OpsEmptyState } from "@/components/admin/ops/OpsEmptyState";
import { OpsPageHeader } from "@/components/admin/ops/OpsPageHeader";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { listOpsEvents } from "@/lib/ops/events";
import { formatMetricDate } from "@/lib/ops/format";
import { maskSupabaseUserId } from "@/lib/ops/safety";
import type { AnalyticsEventSource } from "@/lib/ops/types";
import { analyticsEventSourceValues } from "@/lib/ops/types";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations Events",
};

type EventsPageProps = {
  searchParams?: Promise<{
    date?: string | string[];
    entity_type?: string | string[];
    event_name?: string | string[];
    route?: string | string[];
    source?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSearch(value?: string | string[]) {
  const query = getFirstParam(value)?.trim().replace(/\s+/g, " ");

  return query ? query.slice(0, 120) : undefined;
}

function parseEventName(value?: string | string[]) {
  const eventName = parseSearch(value);

  return eventName && /^[A-Za-z0-9][A-Za-z0-9._:-]{1,95}$/.test(eventName)
    ? eventName
    : undefined;
}

function parseDateWindow(value?: string | string[]) {
  const date = getFirstParam(value);

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {};
  }

  const since = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(since.getTime())) {
    return {};
  }

  const until = new Date(since);
  until.setUTCDate(until.getUTCDate() + 1);

  return {
    since: since.toISOString(),
    until: until.toISOString(),
  };
}

function parseSource(value?: string | string[]) {
  const source = getFirstParam(value);

  return source &&
    analyticsEventSourceValues.includes(source as AnalyticsEventSource)
    ? (source as AnalyticsEventSource)
    : undefined;
}

function metadataSummary(metadata: Json) {
  if (!metadata || typeof metadata !== "object") {
    return "No metadata";
  }

  if (Array.isArray(metadata)) {
    return `${metadata.length} array item${metadata.length === 1 ? "" : "s"}`;
  }

  const keys = Object.keys(metadata);

  return keys.length
    ? `${keys.length} key${keys.length === 1 ? "" : "s"}: ${keys
        .slice(0, 4)
        .join(", ")}`
    : "No metadata";
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

export default async function AdminOpsEventsPage({
  searchParams,
}: EventsPageProps) {
  await requireAdmin("/admin/ops/events");

  const params = await searchParams;
  const eventName = parseEventName(params?.event_name);
  const route = parseSearch(params?.route);
  const entityType = parseSearch(params?.entity_type);
  const source = parseSource(params?.source);
  const date = getFirstParam(params?.date);
  const dateWindow = parseDateWindow(params?.date);
  const events = await listOpsEvents({
    entityType,
    eventName,
    limit: 100,
    route,
    source,
    ...dateWindow,
  });

  return (
    <div className="space-y-8">
      <OpsPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/admin/ops"
          >
            Operations
          </Link>
        }
        description="Review operational events without exposing raw private metadata, member notes, secrets, or content bodies."
        title="Events"
      />

      <CardShell padding="md" tone="subtle">
        <form
          action="/admin/ops/events"
          className="grid gap-3 xl:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.4fr)_minmax(10rem,0.45fr)_minmax(10rem,0.45fr)_minmax(9rem,0.4fr)_auto]"
          method="get"
        >
          <label className="relative">
            <span className="sr-only">Event name</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              defaultValue={eventName ?? ""}
              name="event_name"
              placeholder="Event name"
              type="search"
            />
          </label>

          <SelectFilter
            defaultValue={source ?? ""}
            label="Event source"
            name="source"
          >
            <option value="">All sources</option>
            {analyticsEventSourceValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectFilter>

          <label>
            <span className="sr-only">Route</span>
            <input
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              defaultValue={route ?? ""}
              name="route"
              placeholder="Route"
              type="search"
            />
          </label>

          <label>
            <span className="sr-only">Entity type</span>
            <input
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              defaultValue={entityType ?? ""}
              name="entity_type"
              placeholder="Entity type"
              type="search"
            />
          </label>

          <label>
            <span className="sr-only">Date</span>
            <input
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              defaultValue={date ?? ""}
              name="date"
              type="date"
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
              href="/admin/ops/events"
            >
              Reset
            </Link>
          </div>
        </form>
      </CardShell>

      {events.length === 0 ? (
        <OpsEmptyState
          description="No operations events match the current filters."
          title="No events"
        />
      ) : (
        <CardShell padding="none" tone="default">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Metadata</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-4 font-mono text-xs text-foreground">
                      {event.event_name}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone="muted">{event.source}</Badge>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {event.route || "Not set"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {event.entity_type || "none"}
                      {event.entity_id ? (
                        <span className="block font-mono text-xs">
                          {maskSupabaseUserId(event.entity_id)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      {maskSupabaseUserId(event.user_id) || "none"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {metadataSummary(event.metadata)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatMetricDate(event.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardShell>
      )}
    </div>
  );
}
