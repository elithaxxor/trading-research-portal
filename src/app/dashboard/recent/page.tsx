import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Clock3, Filter, Sparkles } from "lucide-react";

import { markLifecycleSeenAction } from "@/app/dashboard/actions";
import { MarkSeenSubmitButton } from "@/app/dashboard/mark-seen-submit-button";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { IdeaCard } from "@/components/content/idea-card";
import { IdeaStatusBadge } from "@/components/content/idea-status-badge";
import { LifecycleEventBadge } from "@/components/content/LifecycleEventBadge";
import { OutcomeBadge } from "@/components/content/OutcomeBadge";
import { VisibilityBadge } from "@/components/content/visibility-badge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { MemberActionNotice } from "@/components/member-action-notice";
import { buttonVariants } from "@/components/ui/button";
import {
  ensureUserActivityState,
  getNewLifecycleCountSince,
} from "@/lib/activity/user-activity";
import { formatVisibilityLabel } from "@/lib/content/format";
import { getIdeaPreviews } from "@/lib/content/ideas";
import {
  contentVisibilityValues,
  ideaStatusValues,
  parseBooleanSearchParam,
  parseEnumSearchParam,
} from "@/lib/content/search-params";
import type {
  ContentVisibility,
  IdeaOutcome,
  IdeaStatus,
} from "@/lib/content/types";
import { formatLifecycleDate } from "@/lib/lifecycle/format";
import type { IdeaLifecycleEventType } from "@/lib/lifecycle/types";
import { listFollowedTickers } from "@/lib/member/followed-tickers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Recent Updates",
};

export const dynamic = "force-dynamic";

type RecentSearchParams = {
  followed_only?: string | string[];
  major_only?: string | string[];
  notice?: string | string[];
  status?: string | string[];
  visibility?: string | string[];
};

type RecentPageProps = {
  searchParams?: Promise<RecentSearchParams>;
};

type RecentFilters = {
  followedOnly: boolean;
  majorOnly: boolean;
  status?: IdeaStatus;
  visibility?: ContentVisibility;
};

type LifecycleEventRow = {
  event_at: string;
  event_type: IdeaLifecycleEventType;
  id: string;
  is_major: boolean;
  outcome_after: IdeaOutcome | null;
  status_after_update: IdeaStatus | null;
  status_before: IdeaStatus | null;
  title: string;
  trading_ideas: {
    id: string;
    outcome: IdeaOutcome;
    published: boolean;
    slug: string;
    status: IdeaStatus;
    ticker: string;
    title: string;
    visibility: ContentVisibility;
  } | null;
};

async function getAccessibleLifecycleEvents({
  filters,
  followedTickers,
}: {
  filters: RecentFilters;
  followedTickers: string[];
}) {
  const followedTickerSet = new Set(
    followedTickers.map((ticker) => ticker.toUpperCase())
  );
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("idea_updates")
    .select(
      `
        id,
        title,
        event_type,
        event_at,
        is_major,
        status_before,
        status_after_update,
        outcome_after,
        trading_ideas!inner (
          id,
          slug,
          title,
          ticker,
          status,
          outcome,
          visibility,
          published
        )
      `
    )
    .eq("trading_ideas.published", true)
    .order("event_at", { ascending: false })
    .limit(80);

  if (filters.status) {
    query = query.eq("trading_ideas.status", filters.status);
  }

  if (filters.visibility) {
    query = query.eq("trading_ideas.visibility", filters.visibility);
  }

  if (filters.majorOnly) {
    query = query.eq("is_major", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load lifecycle feed.");
  }

  const rows = (data ?? []) as unknown as LifecycleEventRow[];

  return rows
    .filter((row) => row.trading_ideas)
    .filter((row) => {
      if (!filters.followedOnly) {
        return true;
      }

      return followedTickerSet.has(row.trading_ideas!.ticker.toUpperCase());
    })
    .slice(0, 40);
}

function parseRecentFilters(params: RecentSearchParams): RecentFilters {
  return {
    followedOnly: parseBooleanSearchParam(params.followed_only),
    majorOnly: parseBooleanSearchParam(params.major_only),
    status: parseEnumSearchParam(params.status, ideaStatusValues),
    visibility: parseEnumSearchParam(
      params.visibility,
      contentVisibilityValues
    ),
  };
}

function isAfterTimestamp(value: string | null | undefined, timestamp: string | null) {
  if (!value || !timestamp) {
    return false;
  }

  return Date.parse(value) > Date.parse(timestamp);
}

export default async function RecentUpdatesPage({
  searchParams,
}: RecentPageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseRecentFilters(params);
  const [activityState, followedTickerRows, previewRows] = await Promise.all([
    ensureUserActivityState(),
    listFollowedTickers(),
    getIdeaPreviews({
      limit: 80,
      sort: "lifecycle",
      status: filters.status,
      visibility: filters.visibility,
    }),
  ]);
  const followedTickers = followedTickerRows.map((row) => row.ticker);
  const followedTickerSet = new Set(
    followedTickers.map((ticker) => ticker.toUpperCase())
  );
  const lastSeenAt = activityState?.last_lifecycle_seen_at ?? null;
  const [newLifecycleCount, lifecycleEvents] = await Promise.all([
    getNewLifecycleCountSince(lastSeenAt),
    getAccessibleLifecycleEvents({
      filters,
      followedTickers,
    }),
  ]);
  const safePreviewCards = previewRows
    .filter((idea) => {
      if (filters.followedOnly) {
        return followedTickerSet.has(idea.ticker.toUpperCase());
      }

      return true;
    })
    .filter((idea) => {
      if (filters.majorOnly) {
        return idea.has_major_update;
      }

      return true;
    })
    .slice(0, 24);
  const majorEventCount = lifecycleEvents.filter((event) => event.is_major).length;
  const hasAnyResults = lifecycleEvents.length > 0 || safePreviewCards.length > 0;

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Recent Updates" },
        ]}
        description="Recent lifecycle events, major updates, and safe idea previews filtered for your member access."
        title="Recent Updates"
      />

      <MemberActionNotice notice={params.notice} />

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          description={
            lastSeenAt
              ? `Since ${formatLifecycleDate(lastSeenAt)}.`
              : "Use Mark all as seen to start tracking from this visit."
          }
          icon={Sparkles}
          label="New since seen"
          value={String(newLifecycleCount)}
        />
        <DashboardStatCard
          description="Detailed lifecycle events returned by RLS-aware update policies."
          icon={Activity}
          label="Feed events"
          value={String(lifecycleEvents.length)}
        />
        <DashboardStatCard
          description="Major updates are highlighted without fetching locked update bodies."
          icon={Clock3}
          label="Major updates"
          value={String(majorEventCount)}
        />
      </div>

      <CardShell padding="md" tone="subtle">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Filter aria-hidden="true" className="size-4 text-gold-300" />
                <h2 className="text-lg font-semibold text-foreground">
                  Feed controls
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Marking all as seen updates your lifecycle seen timestamp only
                when you click the button.
              </p>
            </div>

            <form action={markLifecycleSeenAction}>
              <MarkSeenSubmitButton />
            </form>
          </div>

          <form
            action="/dashboard/recent"
            className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
          >
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Status
              <select
                className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All statuses</option>
                {ideaStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Visibility
              <select
                className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                defaultValue={filters.visibility ?? ""}
                name="visibility"
              >
                <option value="">All visibility</option>
                {contentVisibilityValues.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {formatVisibilityLabel(visibility)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-3 lg:justify-end">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  className="size-4 rounded border-border bg-background"
                  defaultChecked={filters.followedOnly}
                  name="followed_only"
                  type="checkbox"
                  value="1"
                />
                Followed tickers only
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  className="size-4 rounded border-border bg-background"
                  defaultChecked={filters.majorOnly}
                  name="major_only"
                  type="checkbox"
                  value="1"
                />
                Major updates only
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-3">
              <button className={cn(buttonVariants({ size: "lg" }))} type="submit">
                Apply filters
              </button>
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
                href="/dashboard/recent"
              >
                Clear filters
              </Link>
            </div>
          </form>
        </div>
      </CardShell>

      <DashboardSection
        description="Update titles and lifecycle metadata are shown only for ideas your account can fully access."
        title="Lifecycle feed"
      >
        {lifecycleEvents.length > 0 ? (
          <div className="grid gap-4">
            {lifecycleEvents.map((event) => (
              <LifecycleFeedItem
                event={event}
                isNew={isAfterTimestamp(event.event_at, lastSeenAt)}
                key={event.id}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            actionHref="/ideas"
            actionLabel="Browse ideas"
            description="No recent updates."
            title="No recent updates"
          />
        )}
      </DashboardSection>

      <DashboardSection
        description="Locked premium and pro items appear only as public-safe preview cards."
        title="Recently updated ideas"
      >
        {safePreviewCards.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-3">
            {safePreviewCards.map((idea) => (
              <IdeaCard
                key={idea.id}
                lockedCtaHref={`/ideas/${idea.slug}`}
                lockedCtaLabel="View safe preview"
                {...idea}
              />
            ))}
          </div>
        ) : hasAnyResults ? null : (
          <DashboardEmptyState
            actionHref="/ideas"
            actionLabel="Browse ideas"
            description="No recent updates."
            title="No recent updates"
          />
        )}
      </DashboardSection>
    </div>
  );
}

function LifecycleFeedItem({
  event,
  isNew,
}: {
  event: LifecycleEventRow;
  isNew: boolean;
}) {
  const idea = event.trading_ideas;

  if (!idea) {
    return null;
  }

  const status = event.status_after_update ?? idea.status;
  const outcome = event.outcome_after ?? idea.outcome;

  return (
    <CardShell padding="md" tone="elevated">
      <article className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <VisibilityBadge visibility={idea.visibility} />
            <LifecycleEventBadge eventType={event.event_type} />
            <IdeaStatusBadge status={status} />
            {outcome !== "pending" ? <OutcomeBadge outcome={outcome} /> : null}
            {event.is_major ? (
              <Badge
                className="border-accent/35 bg-accent/10 text-accent"
                tone="muted"
              >
                Major update
              </Badge>
            ) : null}
            {isNew ? <Badge tone="gold">New</Badge> : null}
          </div>

          <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {idea.ticker}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            <Link
              className="outline-none transition hover:text-primary focus-visible:text-primary"
              href={`/ideas/${idea.slug}`}
            >
              {idea.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm font-medium text-foreground">
            {event.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Lifecycle feed items are educational research notes. They are not
            trade instructions, alerts, broker actions, or order execution.
          </p>
        </div>

        <dl className="grid min-w-56 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Metric label="Event date" value={formatLifecycleDate(event.event_at)} />
          <Metric
            label="Before"
            value={event.status_before?.replaceAll("_", " ") ?? "Not recorded"}
          />
          <Metric label="Locked state" value="Full access" />
        </dl>
      </article>
    </CardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/25 p-3">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium capitalize text-foreground">
        {value}
      </dd>
    </div>
  );
}
