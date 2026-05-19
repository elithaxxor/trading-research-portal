import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Filter,
  LockKeyhole,
  RotateCcw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { IdeaCard } from "@/components/content/idea-card";
import { OutcomeBadge } from "@/components/content/OutcomeBadge";
import { VisibilityBadge } from "@/components/content/visibility-badge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { buttonVariants } from "@/components/ui/button";
import { formatVisibilityLabel } from "@/lib/content/format";
import { getIdeaPreviews } from "@/lib/content/ideas";
import {
  contentVisibilityValues,
  getFirstSearchParam,
  ideaOutcomeValues,
  parseBooleanSearchParam,
  parseEnumSearchParam,
} from "@/lib/content/search-params";
import type {
  ContentVisibility,
  IdeaDetail,
  IdeaOutcome,
  IdeaPreview,
} from "@/lib/content/types";
import {
  formatIdeaOutcome,
  formatLifecycleDate,
} from "@/lib/lifecycle/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Closed Reviews",
};

export const dynamic = "force-dynamic";

type ClosedSort = "outcome" | "recently_closed" | "recently_reviewed" | "ticker";

type ClosedSearchParams = {
  closed_recently?: string | string[];
  outcome?: string | string[];
  sort?: string | string[];
  ticker?: string | string[];
  visibility?: string | string[];
};

type ClosedReviewsPageProps = {
  searchParams?: Promise<ClosedSearchParams>;
};

type ClosedReviewFilters = {
  closedRecently: boolean;
  outcome?: IdeaOutcome;
  sort: ClosedSort;
  ticker?: string;
  visibility?: ContentVisibility;
};

type AccessibleReview = Pick<
  IdeaDetail,
  | "closed_at"
  | "id"
  | "lessons_learned"
  | "outcome"
  | "outcome_summary"
  | "review_published_at"
  | "slug"
  | "ticker"
  | "title"
  | "visibility"
>;

const closedSortOptions: { label: string; value: ClosedSort }[] = [
  { label: "Recently closed", value: "recently_closed" },
  { label: "Recently reviewed", value: "recently_reviewed" },
  { label: "Outcome", value: "outcome" },
  { label: "Ticker", value: "ticker" },
];

function parseClosedSort(value: string | string[] | undefined): ClosedSort {
  const firstValue = getFirstSearchParam(value);

  return closedSortOptions.some((option) => option.value === firstValue)
    ? (firstValue as ClosedSort)
    : "recently_closed";
}

function parseTicker(value: string | string[] | undefined) {
  const normalized = getFirstSearchParam(value)?.trim().toUpperCase() ?? "";

  if (!normalized) {
    return undefined;
  }

  return /^[A-Z0-9.-]{1,20}$/.test(normalized) ? normalized : undefined;
}

function parseClosedReviewFilters(
  params: ClosedSearchParams
): ClosedReviewFilters {
  return {
    closedRecently: parseBooleanSearchParam(params.closed_recently),
    outcome: parseEnumSearchParam(params.outcome, ideaOutcomeValues),
    sort: parseClosedSort(params.sort),
    ticker: parseTicker(params.ticker),
    visibility: parseEnumSearchParam(
      params.visibility,
      contentVisibilityValues
    ),
  };
}

function getClosedRecentlyCutoff() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

function getReviewSortTime(
  entry: ClosedReviewEntry,
  sort: "recently_closed" | "recently_reviewed"
) {
  const dateValue =
    sort === "recently_reviewed"
      ? entry.review?.review_published_at ??
        entry.review?.closed_at ??
        entry.preview.last_lifecycle_event_at
      : entry.review?.closed_at ?? entry.preview.last_lifecycle_event_at;
  const timestamp = Date.parse(dateValue ?? "");

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortClosedReviewEntries(
  entries: ClosedReviewEntry[],
  sort: ClosedSort
) {
  return [...entries].sort((a, b) => {
    if (sort === "ticker") {
      return a.preview.ticker.localeCompare(b.preview.ticker);
    }

    if (sort === "outcome") {
      return formatIdeaOutcome(a.preview.outcome).localeCompare(
        formatIdeaOutcome(b.preview.outcome)
      );
    }

    return getReviewSortTime(b, sort) - getReviewSortTime(a, sort);
  });
}

async function listAccessibleClosedReviews(filters: ClosedReviewFilters) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("trading_ideas")
    .select(
      "id,slug,title,ticker,visibility,outcome,closed_at,review_published_at,outcome_summary,lessons_learned"
    )
    .eq("published", true)
    .eq("status", "closed")
    .eq("review_published", true);

  if (filters.outcome) {
    query = query.eq("outcome", filters.outcome);
  }

  if (filters.visibility) {
    query = query.eq("visibility", filters.visibility);
  }

  if (filters.ticker) {
    query = query.eq("ticker", filters.ticker);
  }

  if (filters.closedRecently) {
    query = query.gte("closed_at", getClosedRecentlyCutoff());
  }

  if (filters.sort === "recently_reviewed") {
    query = query.order("review_published_at", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (filters.sort === "outcome") {
    query = query.order("outcome", { ascending: true });
  } else if (filters.sort === "ticker") {
    query = query.order("ticker", { ascending: true });
  } else {
    query = query.order("closed_at", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query.limit(80);

  if (error) {
    throw new Error("Unable to load closed reviews.");
  }

  return (data ?? []) as AccessibleReview[];
}

type ClosedReviewEntry = {
  preview: IdeaPreview;
  review?: AccessibleReview;
};

export default async function ClosedReviewsPage({
  searchParams,
}: ClosedReviewsPageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseClosedReviewFilters(params);
  const [previewRows, accessibleReviews] = await Promise.all([
    getIdeaPreviews({
      limit: 80,
      outcome: filters.outcome,
      search: filters.ticker,
      sort: "closed",
      status: "closed",
      visibility: filters.visibility,
    }),
    listAccessibleClosedReviews(filters),
  ]);
  const reviewById = new Map(
    accessibleReviews.map((review) => [review.id, review])
  );
  const entries = sortClosedReviewEntries(
    previewRows
      .filter((preview) => {
        if (filters.ticker) {
          return preview.ticker.toUpperCase() === filters.ticker;
        }

        return true;
      })
      .filter((preview) => {
        if (!filters.closedRecently) {
          return true;
        }

        const review = reviewById.get(preview.id);
        const reviewDate = review?.closed_at ?? preview.last_lifecycle_event_at;

        return Date.parse(reviewDate ?? "") >= Date.parse(getClosedRecentlyCutoff());
      })
      .filter((preview) => preview.is_locked || reviewById.has(preview.id))
      .map((preview) => ({
        preview,
        review: reviewById.get(preview.id),
      })),
    filters.sort
  ).slice(0, 48);
  const fullReviewCount = entries.filter((entry) => entry.review).length;
  const lockedPreviewCount = entries.length - fullReviewCount;

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Closed Reviews" },
        ]}
        description="Browse closed research ideas and published reviews filtered through your member access."
        title="Closed Reviews"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardStatCard
          description="Closed reviews are educational research reviews, not performance guarantees."
          icon={CheckCircle2}
          label="Reviews"
          value={String(entries.length)}
        />
        <DashboardStatCard
          description="Full outcome summaries and lessons learned visible to your current tier."
          icon={CheckCircle2}
          label="Full access"
          value={String(fullReviewCount)}
        />
        <DashboardStatCard
          description="Locked cards stay limited to safe previews without private review text."
          icon={LockKeyhole}
          label="Locked previews"
          value={String(lockedPreviewCount)}
        />
      </div>

      <CardShell padding="md" tone="subtle">
        <div className="grid gap-5">
          <div>
            <div className="flex items-center gap-2">
              <Filter aria-hidden="true" className="size-4 text-gold-300" />
              <h2 className="text-lg font-semibold text-foreground">
                Review filters
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Filters change what appears in this member dashboard view only.
              They do not calculate performance, P&L, or trading results.
            </p>
          </div>

          <form
            action="/dashboard/closed"
            className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(9rem,0.45fr))_auto]"
          >
            <label className="relative">
              <span className="sr-only">Ticker</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 font-mono text-sm uppercase text-foreground outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25"
                defaultValue={filters.ticker ?? ""}
                maxLength={20}
                name="ticker"
                placeholder="Filter ticker"
                type="search"
              />
            </label>

            <SelectField
              defaultValue={filters.outcome ?? ""}
              label="Outcome"
              name="outcome"
            >
              <option value="">All outcomes</option>
              {ideaOutcomeValues.map((outcome) => (
                <option key={outcome} value={outcome}>
                  {formatIdeaOutcome(outcome)}
                </option>
              ))}
            </SelectField>

            <SelectField
              defaultValue={filters.visibility ?? ""}
              label="Visibility"
              name="visibility"
            >
              <option value="">All visibility</option>
              {contentVisibilityValues.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {formatVisibilityLabel(visibility)}
                </option>
              ))}
            </SelectField>

            <SelectField defaultValue={filters.sort} label="Sort" name="sort">
              {closedSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-secondary/25 px-3 text-sm font-medium text-foreground">
              <input
                className="size-4 rounded border-border bg-background"
                defaultChecked={filters.closedRecently}
                name="closed_recently"
                type="checkbox"
                value="1"
              />
              Closed recently
            </label>

            <div className="flex flex-col gap-3 sm:flex-row xl:col-span-full">
              <button className={cn(buttonVariants({ size: "lg" }))} type="submit">
                Apply filters
              </button>
              <Link
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
                href="/dashboard/closed"
              >
                <RotateCcw data-icon="inline-start" />
                Clear filters
              </Link>
            </div>
          </form>
        </div>
      </CardShell>

      <DashboardSection
        description="Review details are shown only when your account can access the full closed idea."
        title="Review archive"
      >
        {entries.length > 0 ? (
          <div className="grid gap-5">
            {entries.map((entry) =>
              entry.review ? (
                <AccessibleClosedReviewCard
                  key={entry.preview.id}
                  preview={entry.preview}
                  review={entry.review}
                />
              ) : (
                <LockedClosedReviewCard
                  key={entry.preview.id}
                  preview={entry.preview}
                />
              )
            )}
          </div>
        ) : (
          <DashboardEmptyState
            actionHref="/ideas?status=closed&closed_reviews=1"
            actionLabel="Browse closed ideas"
            description="No closed reviews match your current filters."
            title="No closed reviews"
          />
        )}
      </DashboardSection>
    </div>
  );
}

function AccessibleClosedReviewCard({
  preview,
  review,
}: {
  preview: IdeaPreview;
  review: AccessibleReview;
}) {
  return (
    <CardShell padding="lg" tone="elevated">
      <article className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <VisibilityBadge visibility={review.visibility} />
            {review.outcome !== "pending" ? (
              <OutcomeBadge outcome={review.outcome} />
            ) : null}
            <Badge tone="muted">Full review</Badge>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {review.ticker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              <Link
                className="outline-none transition hover:text-primary focus-visible:text-primary"
                href={`/ideas/${review.slug}`}
              >
                {review.title}
              </Link>
            </h2>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Metric label="Closed" value={formatLifecycleDate(review.closed_at)} />
            <Metric
              label="Reviewed"
              value={formatLifecycleDate(review.review_published_at)}
            />
          </dl>

          <p className="rounded-lg border border-border bg-secondary/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Closed reviews are educational research reviews, not performance
            guarantees. This view does not calculate performance percentages,
            P&L, or trade execution results.
          </p>
        </div>

        <div className="grid gap-5">
          <ReviewText
            body={review.outcome_summary}
            fallback="No outcome summary has been published yet."
            title="Outcome summary"
          />
          <ReviewText
            body={review.lessons_learned}
            fallback="No lessons learned have been published yet."
            title="Lessons learned"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Public preview:{" "}
            {preview.public_preview ??
              "Public-safe preview copy is being prepared."}
          </p>
        </div>
      </article>
    </CardShell>
  );
}

function LockedClosedReviewCard({ preview }: { preview: IdeaPreview }) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.35fr)]">
      <IdeaCard
        lockedCtaHref={`/ideas/${preview.slug}`}
        lockedCtaLabel="View safe preview"
        {...preview}
      />
      <CardShell padding="md" tone="subtle">
        <div className="flex h-full flex-col gap-4">
          <div className="flex size-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Review details locked
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Outcome summaries, lessons learned, private lifecycle details, and
              full review notes stay protected until your tier can access this
              idea.
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-2">
            <VisibilityBadge visibility={preview.visibility} />
            <Badge tone="muted">Safe preview only</Badge>
          </div>
        </div>
      </CardShell>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/25 p-4">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ReviewText({
  body,
  fallback,
  title,
}: {
  body: string | null;
  fallback: string;
  title: string;
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
        {body ?? fallback}
      </p>
    </section>
  );
}

type SelectFieldProps = React.ComponentPropsWithoutRef<"select"> & {
  label: string;
};

function SelectField({
  children,
  className,
  label,
  ...props
}: SelectFieldProps) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className={cn(
          "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
