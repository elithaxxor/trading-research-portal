import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { markDashboardSeenAction } from "@/app/dashboard/actions";
import { MarkSeenSubmitButton } from "@/app/dashboard/mark-seen-submit-button";
import { Badge } from "@/components/badge";
import { AuthNotice } from "@/components/auth-notice";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/content/empty-state";
import { IdeaCard } from "@/components/content/idea-card";
import { IdeaStatusBadge } from "@/components/content/idea-status-badge";
import { OutcomeBadge } from "@/components/content/OutcomeBadge";
import { ResearchPostCard } from "@/components/content/research-post-card";
import { VisibilityBadge } from "@/components/content/visibility-badge";
import { SignOutSubmitButton } from "@/components/sign-out-submit-button";
import { buttonVariants } from "@/components/ui/button";
import {
  ensureUserActivityState,
  getLifecycleIdeaDetailsBySlugs,
  getNewLifecycleCountSince,
  getRecentlyUpdatedIdeasSince,
  type DashboardLifecycleIdea,
  type RecentlyUpdatedIdea,
} from "@/lib/activity/user-activity";
import { ensureUserRecords } from "@/lib/auth/ensure-user-records";
import { getIdeaPreviews } from "@/lib/content/ideas";
import { getPostPreviews } from "@/lib/content/posts";
import type { IdeaPreview, IdeaStatus, PostPreview } from "@/lib/content/types";
import { formatLifecycleDate } from "@/lib/lifecycle/format";
import type { IdeaOutcome } from "@/lib/lifecycle/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/dashboard",
  },
  description:
    "Private dashboard shell for Trading Research Portal account access.",
  openGraph: {
    description:
      "Private dashboard shell for Trading Research Portal account access.",
    title: "Dashboard",
    url: "/dashboard",
  },
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

type DashboardLifecycleCard = IdeaPreview & {
  lastLifecycleEventAt: string | null;
  lifecycleOutcome: IdeaOutcome | null;
  reviewPublished: boolean | null;
};

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Fdashboard");
}

function getCardSortTime(idea: Pick<IdeaPreview, "published_at" | "updated_at">) {
  const value = idea.updated_at ?? idea.published_at;
  const time = value ? Date.parse(value) : 0;

  return Number.isNaN(time) ? 0 : time;
}

async function getDashboardLifecycleCards({
  limit = 3,
  sort = "updated",
  statuses,
}: {
  limit?: number;
  sort?: "published" | "updated";
  statuses?: IdeaStatus[];
}) {
  const previewSets =
    statuses && statuses.length > 0
      ? await Promise.all(
          statuses.map((status) => getIdeaPreviews({ limit, sort, status }))
        )
      : [await getIdeaPreviews({ limit, sort })];

  const previewsById = new Map<string, IdeaPreview>();

  for (const preview of previewSets.flat()) {
    if (!previewsById.has(preview.id)) {
      previewsById.set(preview.id, preview);
    }
  }

  const previews = Array.from(previewsById.values())
    .sort((a, b) => getCardSortTime(b) - getCardSortTime(a))
    .slice(0, limit);

  const lifecycleDetails = await getLifecycleIdeaDetailsBySlugs(
    previews.filter((preview) => !preview.is_locked).map((preview) => preview.slug)
  );
  const detailsBySlug = new Map<string, DashboardLifecycleIdea>(
    lifecycleDetails.map((idea) => [idea.slug, idea])
  );

  return previews.map((preview): DashboardLifecycleCard => {
    const detail = preview.is_locked ? null : detailsBySlug.get(preview.slug);

    return {
      ...preview,
      lastLifecycleEventAt: detail?.last_lifecycle_event_at ?? null,
      lifecycleOutcome: detail?.outcome ?? null,
      reviewPublished: detail?.review_published ?? null,
    };
  });
}

async function getDashboardContext() {
  const warnings: string[] = [];
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    loginRedirect();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    loginRedirect();
  }

  await ensureUserRecords(user).catch(() => {
    warnings.push(
      "Account setup is still preparing. Some dashboard details may show default access until setup finishes."
    );
  });

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("tier,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    warnings.push(
      "We could not load subscription details right now. Your account is shown with safe default access."
    );
  }

  let lastLifecycleSeenAt: string | null = null;

  try {
    const activityState = await ensureUserActivityState();
    lastLifecycleSeenAt =
      activityState?.last_lifecycle_seen_at ??
      activityState?.last_dashboard_seen_at ??
      null;
  } catch {
    warnings.push(
      "New-since-last-visit markers could not be loaded right now."
    );
  }

  const [
    latestIdeasResult,
    recentlyUpdatedIdeasResult,
    activeTriggeredIdeasResult,
    closedReviewIdeasResult,
    invalidatedIdeasResult,
    latestResearchResult,
    newLifecycleCountResult,
    updatedIdeasSinceLastSeenResult,
  ] = await Promise.allSettled([
    getIdeaPreviews({ limit: 3 }),
    getDashboardLifecycleCards({ limit: 3, sort: "updated" }),
    getDashboardLifecycleCards({
      limit: 3,
      statuses: ["active", "triggered"],
    }),
    getDashboardLifecycleCards({ limit: 3, statuses: ["closed"] }),
    getDashboardLifecycleCards({ limit: 3, statuses: ["invalidated"] }),
    getPostPreviews({ limit: 3 }),
    getNewLifecycleCountSince(lastLifecycleSeenAt),
    getRecentlyUpdatedIdeasSince(lastLifecycleSeenAt),
  ]);

  if (latestIdeasResult.status === "rejected") {
    warnings.push("Latest trading idea previews could not be loaded.");
  }

  if (recentlyUpdatedIdeasResult.status === "rejected") {
    warnings.push("Recently updated idea previews could not be loaded.");
  }

  if (activeTriggeredIdeasResult.status === "rejected") {
    warnings.push("Active and triggered idea widgets could not be loaded.");
  }

  if (closedReviewIdeasResult.status === "rejected") {
    warnings.push("Closed review widgets could not be loaded.");
  }

  if (invalidatedIdeasResult.status === "rejected") {
    warnings.push("Invalidated idea widgets could not be loaded.");
  }

  if (latestResearchResult.status === "rejected") {
    warnings.push("Latest research previews could not be loaded.");
  }

  if (newLifecycleCountResult.status === "rejected") {
    warnings.push("New lifecycle counts could not be loaded.");
  }

  if (updatedIdeasSinceLastSeenResult.status === "rejected") {
    warnings.push("Updated idea markers could not be loaded.");
  }

  return {
    latestIdeas:
      latestIdeasResult.status === "fulfilled" ? latestIdeasResult.value : [],
    latestResearch:
      latestResearchResult.status === "fulfilled"
        ? latestResearchResult.value
        : [],
    lastLifecycleSeenAt,
    newLifecycleCount:
      newLifecycleCountResult.status === "fulfilled"
        ? newLifecycleCountResult.value
        : 0,
    recentlyUpdatedIdeas:
      recentlyUpdatedIdeasResult.status === "fulfilled"
        ? recentlyUpdatedIdeasResult.value
        : [],
    activeTriggeredIdeas:
      activeTriggeredIdeasResult.status === "fulfilled"
        ? activeTriggeredIdeasResult.value
        : [],
    closedReviewIdeas:
      closedReviewIdeasResult.status === "fulfilled"
        ? closedReviewIdeasResult.value
        : [],
    invalidatedIdeas:
      invalidatedIdeasResult.status === "fulfilled"
        ? invalidatedIdeasResult.value
        : [],
    updatedIdeasSinceLastSeen:
      updatedIdeasSinceLastSeenResult.status === "fulfilled"
        ? updatedIdeasSinceLastSeenResult.value
        : [],
    subscription,
    user,
    warnings,
  };
}

function formatTier(subscription: Pick<SubscriptionRow, "tier"> | null) {
  const tier = subscription?.tier ?? "free";

  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function formatStatus(
  subscription: Pick<SubscriptionRow, "status"> | null
) {
  if (!subscription) {
    return "Free access";
  }

  return subscription.status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const {
    activeTriggeredIdeas,
    closedReviewIdeas,
    invalidatedIdeas,
    latestIdeas,
    latestResearch,
    lastLifecycleSeenAt,
    newLifecycleCount,
    recentlyUpdatedIdeas,
    subscription,
    updatedIdeasSinceLastSeen,
    user,
    warnings,
  } = await getDashboardContext();
  const tierLabel = formatTier(subscription);
  const statusLabel = formatStatus(subscription);

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              <Badge tone="gold">Member dashboard</Badge>
              <div className="flex flex-col gap-3">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  Welcome to your research dashboard.
                </h1>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  Review RLS-aware research previews, recent updates, and your
                  current account tier from one protected workspace.
                </p>
              </div>
            </div>

            <form action={signOutAction}>
              <SignOutSubmitButton className="w-full sm:w-auto" />
            </form>
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-6 py-10 sm:py-12">
          {warnings.map((warning) => (
            <AuthNotice key={warning} message={warning} tone="info" />
          ))}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <CardShell padding="lg" tone="elevated">
              <div className="flex flex-col gap-6">
                <div>
                  <Badge tone="muted">Signed in</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Account access
                  </h2>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <dt className="text-sm text-muted-foreground">Email</dt>
                    <dd className="mt-2 break-words text-sm font-medium text-foreground">
                      {user.email ?? "Email unavailable"}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/35 p-4">
                    <dt className="text-sm text-muted-foreground">
                      Current tier
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {tierLabel}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/35 p-4 sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">
                      Subscription status
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {statusLabel}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardShell>

            <CardShell padding="lg" tone="subtle">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <Badge tone="gold">Account Tier Summary</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    {tierLabel} research access
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Your account is currently shown as {tierLabel.toLowerCase()}{" "}
                    with status {statusLabel.toLowerCase()}. Content access is
                    enforced by Supabase RLS, not client-side hiding.
                  </p>
                </div>
                <Link
                  className={cn(
                    "w-full sm:w-fit",
                    buttonVariants({ size: "lg", variant: "outline" })
                  )}
                  href="/pricing"
                >
                  View access options
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </div>
            </CardShell>
          </div>

          <DashboardActivitySummary
            lastSeenAt={lastLifecycleSeenAt}
            newLifecycleCount={newLifecycleCount}
            updatedIdeas={updatedIdeasSinceLastSeen}
          />

          <DashboardIdeaSection
            description="Latest safe previews across free, premium, and pro trading research. Locked cards do not expose full thesis, levels, or targets."
            emptyDescription="No trading idea previews are available yet."
            ideas={latestIdeas}
            title="Latest Trading Ideas"
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardLifecycleWidget
              description="Preview cards ordered by recent updates. Locked cards keep lifecycle details protected."
              emptyDescription="No recently updated idea previews are available yet."
              ideas={recentlyUpdatedIdeas}
              title="Recently Updated Ideas"
            />

            <DashboardLifecycleWidget
              description="Open research that is currently active, triggered, or still developing."
              emptyDescription="No active or triggered idea previews are available yet."
              ideas={activeTriggeredIdeas}
              title="Active / Triggered Ideas"
            />

            <DashboardLifecycleWidget
              description="Closed research where outcome labels or reviews appear only when your access level allows full content."
              emptyDescription="No closed idea previews are available yet."
              ideas={closedReviewIdeas}
              title="Closed Reviews"
            />

            <DashboardLifecycleWidget
              description="Invalidated research previews for reviewing how a setup changed without implying trade execution."
              emptyDescription="No invalidated idea previews are available yet."
              ideas={invalidatedIdeas}
              title="Invalidated Ideas"
            />
          </div>

          <DashboardResearchSection posts={latestResearch} />
        </Container>
      </section>
    </main>
  );
}

function DashboardActivitySummary({
  lastSeenAt,
  newLifecycleCount,
  updatedIdeas,
}: {
  lastSeenAt: string | null;
  newLifecycleCount: number;
  updatedIdeas: RecentlyUpdatedIdea[];
}) {
  return (
    <CardShell padding="lg" tone="elevated">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <div>
            <Badge tone="gold">New since last visit</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              {updatedIdeas.length} updated{" "}
              {updatedIdeas.length === 1 ? "idea" : "ideas"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {lastSeenAt
                ? `Since ${formatDashboardDate(lastSeenAt)}, ${newLifecycleCount} lifecycle ${newLifecycleCount === 1 ? "update has" : "updates have"} been recorded across research you can access.`
                : "No previous lifecycle visit has been recorded yet. Use the button below after reviewing your dashboard to start tracking future updates."}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              This feature stores only per-user read markers for dashboard and
              lifecycle recency. It does not track trading behavior.
            </p>
          </div>

          <form action={markDashboardSeenAction}>
            <MarkSeenSubmitButton />
          </form>
        </div>

        <div className="grid gap-3">
          {updatedIdeas.length > 0 ? (
            updatedIdeas.map((idea) => (
              <Link
                className="rounded-lg border border-border bg-secondary/28 p-4 transition-colors hover:bg-secondary/45"
                href={`/ideas/${idea.slug}`}
                key={idea.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {idea.title}
                    </p>
                    <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {idea.ticker} / {idea.visibility}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDashboardDate(
                      idea.last_lifecycle_event_at ?? idea.updated_at
                    )}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-lg border border-border bg-secondary/28 px-4 py-3 text-sm leading-6 text-muted-foreground">
              No accessible idea updates are newer than your saved lifecycle
              marker.
            </p>
          )}
        </div>
      </div>
    </CardShell>
  );
}

function DashboardIdeaSection({
  description,
  emptyDescription,
  ideas,
  title,
}: {
  description: string;
  emptyDescription: string;
  ideas: IdeaPreview[];
  title: string;
}) {
  return (
    <section className="flex flex-col gap-5">
      <WidgetHeader
        ctaHref="/ideas"
        ctaLabel="View all ideas"
        description={description}
        title={title}
      />

      {ideas.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={`${title}-${idea.id}`}
              lockedCtaHref="/pricing"
              lockedCtaLabel="View access options"
              {...idea}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/ideas"
          description={emptyDescription}
          title="No ideas found"
        />
      )}
    </section>
  );
}

function DashboardLifecycleWidget({
  description,
  emptyDescription,
  ideas,
  title,
}: {
  description: string;
  emptyDescription: string;
  ideas: DashboardLifecycleCard[];
  title: string;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <WidgetHeader
        ctaHref="/ideas"
        ctaLabel="View all ideas"
        description={description}
        title={title}
      />

      {ideas.length > 0 ? (
        <div className="grid gap-3">
          {ideas.map((idea) => (
            <DashboardLifecycleCardLink idea={idea} key={`${title}-${idea.id}`} />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/ideas"
          description={emptyDescription}
          title="No ideas found"
        />
      )}
    </section>
  );
}

function DashboardLifecycleCardLink({
  idea,
}: {
  idea: DashboardLifecycleCard;
}) {
  const displayDate = idea.is_locked
    ? idea.updated_at
    : idea.lastLifecycleEventAt ?? idea.updated_at;
  const dateLabel = idea.is_locked ? "Updated" : "Lifecycle";
  const outcome =
    idea.status === "closed" && !idea.is_locked ? idea.lifecycleOutcome : null;

  return (
    <Link
      className="group rounded-lg border border-border bg-secondary/24 p-4 transition-colors hover:bg-secondary/40"
      href={`/ideas/${idea.slug}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <VisibilityBadge visibility={idea.visibility} />
          <IdeaStatusBadge status={idea.status} />
          {idea.is_locked ? (
            <Badge
              className="gap-1.5 border-border bg-card text-muted-foreground"
              tone="muted"
            >
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              Locked
            </Badge>
          ) : null}
          {outcome ? <OutcomeBadge outcome={outcome} /> : null}
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
            {idea.title}
          </h3>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {idea.ticker}
          </p>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {dateLabel}
            </p>
            <p className="mt-1 text-foreground">
              {formatLifecycleDate(displayDate)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Access
            </p>
            <p className="mt-1 text-foreground">
              {idea.is_locked ? "Preview only" : "Full lifecycle visible"}
            </p>
          </div>
        </div>

        {idea.is_locked ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Full lifecycle notes, outcome details, chart context, and research
            levels stay protected until your account can access this idea.
          </p>
        ) : idea.status === "closed" && idea.reviewPublished === false ? (
          <p className="text-xs leading-5 text-muted-foreground">
            This idea is closed. A structured review has not been published yet.
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function DashboardResearchSection({ posts }: { posts: PostPreview[] }) {
  return (
    <section className="flex flex-col gap-5">
      <WidgetHeader
        ctaHref="/research"
        ctaLabel="View all research"
        description="Latest market commentary and educational research previews. Locked posts keep full body content protected."
        title="Latest Research"
      />

      {posts.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {posts.map((post) => (
            <ResearchPostCard
              key={post.id}
              lockedCtaHref="/pricing"
              lockedCtaLabel="View access options"
              {...post}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/research"
          description="No research post previews are available yet."
          title="No research found"
        />
      )}
    </section>
  );
}

function WidgetHeader({
  ctaHref,
  ctaLabel,
  description,
  title,
}: {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <Link
        className={cn(
          "w-full sm:w-auto",
          buttonVariants({ size: "lg", variant: "outline" })
        )}
        href={ctaHref}
      >
        {ctaLabel}
        <ArrowUpRight data-icon="inline-end" />
      </Link>
    </div>
  );
}

function formatDashboardDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
