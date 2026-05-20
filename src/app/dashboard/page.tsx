import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive,
  ArrowUpRight,
  Bookmark,
  Eye,
  LockKeyhole,
  Package,
  RefreshCw,
  Settings,
  Star,
} from "lucide-react";

import { markDashboardSeenAction } from "@/app/dashboard/actions";
import { MarkSeenSubmitButton } from "@/app/dashboard/mark-seen-submit-button";
import { AuthNotice } from "@/components/auth-notice";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { IdeaCard } from "@/components/content/idea-card";
import { IdeaStatusBadge } from "@/components/content/idea-status-badge";
import { OutcomeBadge } from "@/components/content/OutcomeBadge";
import { VisibilityBadge } from "@/components/content/visibility-badge";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { MemberActionNotice } from "@/components/member-action-notice";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { buttonVariants } from "@/components/ui/button";
import {
  ensureUserActivityState,
  getNewLifecycleCountSince,
  getRecentlyUpdatedIdeasSince,
  type RecentlyUpdatedIdea,
} from "@/lib/activity/user-activity";
import { ensureUserRecords } from "@/lib/auth/ensure-user-records";
import {
  formatSubscriptionAccessState,
  formatSubscriptionStatus,
  formatSubscriptionTier,
} from "@/lib/billing/format";
import { getEffectiveSubscriptionTier } from "@/lib/billing/tiers";
import { getIdeaPreviews } from "@/lib/content/ideas";
import type { IdeaPreview } from "@/lib/content/types";
import { formatLifecycleDate } from "@/lib/lifecycle/format";
import {
  formatMemberDashboardView,
  formatMemberSortPreference,
} from "@/lib/member/format";
import { getMemberDashboardData } from "@/lib/member/dashboard";
import type { MemberDashboardData, MemberPreferences } from "@/lib/member/types";
import { getCurrentSoftwareAccessTier } from "@/lib/software/access";
import {
  listAdminSoftwareProducts,
  listSoftwareProductPreviews,
} from "@/lib/software/products";
import type { SoftwareProductPreview } from "@/lib/software/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  alternates: {
    canonical: "/dashboard",
  },
  description:
    "Advanced member dashboard for saved ideas, followed tickers, watchlist, lifecycle activity, and software access.",
  openGraph: {
    description:
      "Advanced member dashboard for saved ideas, followed tickers, watchlist, lifecycle activity, and software access.",
    title: "Dashboard",
    url: "/dashboard",
  },
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

type DashboardPreferenceSettings = Pick<
  MemberPreferences,
  | "default_sort"
  | "default_view"
  | "preferred_asset_classes"
  | "preferred_statuses"
  | "preferred_visibility"
  | "show_charts_on_dashboard"
  | "show_closed_reviews"
  | "show_locked_previews"
  | "show_software_section"
>;

type SoftwareSummary = {
  canViewSoftware: boolean;
  isAdmin: boolean;
  products: SoftwareProductPreview[];
  totalCount: number;
  userTier: Database["public"]["Enums"]["subscription_tier"] | null;
};

const fallbackDashboardPreferences: DashboardPreferenceSettings = {
  default_sort: "recently_updated",
  default_view: "overview",
  preferred_asset_classes: [],
  preferred_statuses: [],
  preferred_visibility: [],
  show_charts_on_dashboard: true,
  show_closed_reviews: true,
  show_locked_previews: true,
  show_software_section: true,
};

const emptyMemberDashboardData: MemberDashboardData = {
  closedReviewCards: [],
  counts: {
    closedReviews: 0,
    followedTickers: 0,
    lockedPreviews: 0,
    memberNotes: 0,
    savedIdeas: 0,
  },
  followedTickerIdeaCards: [],
  followedTickers: [],
  lockedPreviewCards: [],
  preferences: null,
  recentlyUpdatedIdeas: [],
  savedIdeaCards: [],
  savedIdeas: [],
  watchlistItems: [],
};

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Fdashboard");
}

function getIdeaPreviewSortForPreferences(
  preferences: DashboardPreferenceSettings
) {
  if (preferences.default_sort === "newest_published") {
    return "published";
  }

  if (preferences.default_sort === "lifecycle_recent") {
    return "lifecycle";
  }

  return "updated";
}

function getSortTime(idea: IdeaPreview, preferences: DashboardPreferenceSettings) {
  const value =
    preferences.default_sort === "newest_published"
      ? idea.published_at
      : preferences.default_sort === "lifecycle_recent"
        ? idea.last_lifecycle_event_at ?? idea.updated_at ?? idea.published_at
        : idea.updated_at ?? idea.published_at;
  const time = value ? Date.parse(value) : 0;

  return Number.isNaN(time) ? 0 : time;
}

function matchesPreferences(
  idea: IdeaPreview,
  preferences: DashboardPreferenceSettings
) {
  if (!preferences.show_locked_previews && idea.is_locked) {
    return false;
  }

  if (
    preferences.preferred_asset_classes.length > 0 &&
    !preferences.preferred_asset_classes.includes(idea.asset_class)
  ) {
    return false;
  }

  if (
    preferences.preferred_statuses.length > 0 &&
    !preferences.preferred_statuses.includes(idea.status)
  ) {
    return false;
  }

  if (
    preferences.preferred_visibility.length > 0 &&
    !preferences.preferred_visibility.includes(idea.visibility)
  ) {
    return false;
  }

  return true;
}

function applyDashboardPreferences(
  ideas: IdeaPreview[],
  preferences: DashboardPreferenceSettings,
  limit = 3
) {
  return ideas
    .filter((idea) => matchesPreferences(idea, preferences))
    .sort((a, b) => {
      if (preferences.default_sort === "status") {
        return (
          a.status.localeCompare(b.status) ||
          Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? "")
        );
      }

      if (preferences.default_sort === "ticker") {
        return (
          a.ticker.localeCompare(b.ticker) ||
          Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? "")
        );
      }

      return getSortTime(b, preferences) - getSortTime(a, preferences);
    })
    .slice(0, limit);
}

async function getSoftwareSummary(
  preferences: DashboardPreferenceSettings
): Promise<SoftwareSummary> {
  const access = await getCurrentSoftwareAccessTier();
  const canViewSoftware =
    access.isAdmin ||
    access.userTier === "premium" ||
    access.userTier === "pro";

  if (!preferences.show_software_section) {
    return {
      canViewSoftware,
      isAdmin: access.isAdmin,
      products: [],
      totalCount: 0,
      userTier: access.userTier,
    };
  }

  if (!canViewSoftware) {
    return {
      canViewSoftware,
      isAdmin: access.isAdmin,
      products: [],
      totalCount: 0,
      userTier: access.userTier,
    };
  }

  const result = access.isAdmin
    ? await listAdminSoftwareProducts({ limit: 6 })
    : await listSoftwareProductPreviews({ limit: 6 });

  return {
    canViewSoftware,
    isAdmin: access.isAdmin,
    products: result.items,
    totalCount: result.count ?? result.items.length,
    userTier: access.userTier,
  };
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
    dashboardDataResult,
    newLifecycleCountResult,
    updatedIdeasSinceLastSeenResult,
  ] = await Promise.allSettled([
    getMemberDashboardData(),
    getNewLifecycleCountSince(lastLifecycleSeenAt),
    getRecentlyUpdatedIdeasSince(lastLifecycleSeenAt),
  ]);

  if (dashboardDataResult.status === "rejected") {
    warnings.push("Member dashboard data could not be loaded right now.");
  }

  if (newLifecycleCountResult.status === "rejected") {
    warnings.push("New lifecycle counts could not be loaded.");
  }

  if (updatedIdeasSinceLastSeenResult.status === "rejected") {
    warnings.push("Updated idea markers could not be loaded.");
  }

  const dashboardData =
    dashboardDataResult.status === "fulfilled"
      ? dashboardDataResult.value
      : emptyMemberDashboardData;
  const preferences = dashboardData.preferences ?? fallbackDashboardPreferences;

  const [activeTriggeredResult, softwareSummaryResult] = await Promise.allSettled([
    getActiveTriggeredIdeas(preferences),
    getSoftwareSummary(preferences),
  ]);

  if (activeTriggeredResult.status === "rejected") {
    warnings.push("Active and triggered ideas could not be loaded.");
  }

  if (softwareSummaryResult.status === "rejected") {
    warnings.push("Software library summary could not be loaded.");
  }

  return {
    activeTriggeredIdeas:
      activeTriggeredResult.status === "fulfilled"
        ? activeTriggeredResult.value
        : [],
    dashboardData,
    lastLifecycleSeenAt,
    newLifecycleCount:
      newLifecycleCountResult.status === "fulfilled"
        ? newLifecycleCountResult.value
        : 0,
    preferences,
    softwareSummary:
      softwareSummaryResult.status === "fulfilled"
        ? softwareSummaryResult.value
        : {
            canViewSoftware: false,
            isAdmin: false,
            products: [],
            totalCount: 0,
            userTier: getEffectiveSubscriptionTier(
              subscription?.tier,
              subscription?.status,
              false
            ),
          },
    subscription,
    updatedIdeasSinceLastSeen:
      updatedIdeasSinceLastSeenResult.status === "fulfilled"
        ? updatedIdeasSinceLastSeenResult.value
        : [],
    user,
    warnings,
  };
}

async function getActiveTriggeredIdeas(preferences: DashboardPreferenceSettings) {
  const previewSets = await Promise.all([
    getIdeaPreviews({
      limit: 12,
      sort: getIdeaPreviewSortForPreferences(preferences),
      status: "active",
    }),
    getIdeaPreviews({
      limit: 12,
      sort: getIdeaPreviewSortForPreferences(preferences),
      status: "triggered",
    }),
  ]);
  const ideasById = new Map<string, IdeaPreview>();

  for (const idea of previewSets.flat()) {
    ideasById.set(idea.id, idea);
  }

  return applyDashboardPreferences(Array.from(ideasById.values()), preferences, 6);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const {
    activeTriggeredIdeas,
    dashboardData,
    lastLifecycleSeenAt,
    newLifecycleCount,
    preferences,
    softwareSummary,
    subscription,
    updatedIdeasSinceLastSeen,
    user,
    warnings,
  } = await getDashboardContext();
  const accountTierLabel = formatSubscriptionTier(subscription?.tier);
  const effectiveTier = getEffectiveSubscriptionTier(
    subscription?.tier,
    subscription?.status,
    false
  );
  const effectiveTierLabel = softwareSummary.isAdmin
    ? "Admin"
    : formatSubscriptionTier(effectiveTier);
  const statusLabel = formatSubscriptionStatus(subscription?.status);
  const accessLabel = softwareSummary.isAdmin
    ? "Admin management access"
    : formatSubscriptionAccessState(subscription?.tier, subscription?.status);
  const currentPeriodEndLabel = formatDashboardDate(
    subscription?.current_period_end
  );
  const savedIdeaCards = applyDashboardPreferences(
    dashboardData.savedIdeaCards,
    preferences,
    3
  );
  const followedTickerIdeaCards = applyDashboardPreferences(
    dashboardData.followedTickerIdeaCards,
    preferences,
    3
  );
  const recentlyUpdatedIdeas = applyDashboardPreferences(
    dashboardData.recentlyUpdatedIdeas,
    preferences,
    6
  );
  const closedReviewCards = preferences.show_closed_reviews
    ? applyDashboardPreferences(dashboardData.closedReviewCards, preferences, 3)
    : [];
  const lockedPreviewCards = preferences.show_locked_previews
    ? applyDashboardPreferences(dashboardData.lockedPreviewCards, preferences, 3)
    : [];

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        description="Your member home base for saved research, followed tickers, watchlist context, lifecycle activity, software access, and dashboard preferences."
        title="Dashboard overview"
      />

      <MemberActionNotice notice={params?.notice} />

      {warnings.map((warning) => (
        <AuthNotice key={warning} message={warning} tone="info" />
      ))}

      <AccountTierSummary
        accessLabel={accessLabel}
        accountTierLabel={accountTierLabel}
        currentPeriodEndLabel={currentPeriodEndLabel}
        email={user.email ?? "Email unavailable"}
        effectiveTierLabel={effectiveTierLabel}
        showPremiumUpgrade={!softwareSummary.isAdmin && effectiveTier === "free"}
        showProUpgrade={!softwareSummary.isAdmin && effectiveTier !== "pro"}
        statusLabel={statusLabel}
      />

      <DashboardStats
        closedReviews={dashboardData.counts.closedReviews}
        followedTickers={dashboardData.counts.followedTickers}
        newUpdates={newLifecycleCount}
        savedIdeas={dashboardData.counts.savedIdeas}
        softwareAvailable={softwareSummary.totalCount}
        watchlistItems={dashboardData.watchlistItems.length}
      />

      <QuickActions />

      <DashboardActivitySummary
        lastSeenAt={lastLifecycleSeenAt}
        newLifecycleCount={newLifecycleCount}
        updatedIdeas={updatedIdeasSinceLastSeen.slice(0, 6)}
      />

      <DashboardPreferenceSummary preferences={preferences} />

      <div className="grid gap-6 xl:grid-cols-2">
        <SavedIdeasOverview ideas={savedIdeaCards} />
        <FollowedTickersOverview
          followedTickerIdeaCards={followedTickerIdeaCards}
          followedTickers={dashboardData.followedTickers.slice(0, 6)}
        />
        <WatchlistOverview items={dashboardData.watchlistItems.slice(0, 6)} />
        <DashboardIdeaPreviewSection
          actionHref="/dashboard/recent"
          actionLabel="View recent updates"
          description="Recent accessible research from saved ideas and followed tickers. Locked previews never include protected thesis, levels, update bodies, or chart details."
          emptyDescription="Save ideas or follow tickers to personalize this section."
          ideas={recentlyUpdatedIdeas}
          title="Recently Updated Ideas"
        />
        <DashboardIdeaPreviewSection
          actionHref="/ideas?status=active"
          actionLabel="View active ideas"
          description="Active and triggered research previews through the same RLS-aware access rules as the main ideas page."
          emptyDescription="No active or triggered idea previews match your preferences yet."
          ideas={activeTriggeredIdeas}
          title="Active / Triggered Ideas"
        />
        {preferences.show_closed_reviews ? (
          <DashboardIdeaPreviewSection
            actionHref="/dashboard/closed"
            actionLabel="View closed reviews"
            description="Closed review cards show full outcome context only when your account can access the idea."
            emptyDescription="No closed reviews match your preferences yet."
            ideas={closedReviewCards}
            title="Closed Reviews"
          />
        ) : null}
      </div>

      {preferences.show_software_section ? (
        <DashboardSoftwareSection summary={softwareSummary} />
      ) : null}

      {preferences.show_locked_previews ? (
        <DashboardIdeaPreviewSection
          actionHref="/ideas"
          actionLabel="View all ideas"
          description="Safe premium/pro previews available to your account. Full locked research, lifecycle details, and chart metadata stay protected."
          emptyDescription="No locked previews match your preferences right now."
          ideas={lockedPreviewCards}
          title="Locked Premium/Pro Previews"
        />
      ) : null}
    </div>
  );
}

function AccountTierSummary({
  accessLabel,
  accountTierLabel,
  currentPeriodEndLabel,
  email,
  effectiveTierLabel,
  showPremiumUpgrade,
  showProUpgrade,
  statusLabel,
}: {
  accessLabel: string;
  accountTierLabel: string;
  currentPeriodEndLabel: string;
  email: string;
  effectiveTierLabel: string;
  showPremiumUpgrade: boolean;
  showProUpgrade: boolean;
  statusLabel: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <CardShell padding="lg" tone="elevated">
        <div className="flex flex-col gap-6">
          <div>
            <Badge tone="muted">Account Access</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              {effectiveTierLabel} member workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Personalized research widgets use your current session and
              Supabase RLS. Paid access follows Stripe webhook-synced billing
              status, and locked member content is not shipped to the page.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DashboardDetail label="Email" value={email} />
            <DashboardDetail label="Account tier" value={accountTierLabel} />
            <DashboardDetail label="Billing status" value={statusLabel} />
            <DashboardDetail label="Active access" value={accessLabel} />
            <DashboardDetail
              label="Next renewal / period end"
              value={currentPeriodEndLabel}
            />
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {showPremiumUpgrade ? (
              <Link
                className={cn(
                  "w-full sm:w-auto",
                  buttonVariants({ size: "lg", variant: "default" })
                )}
                href="/pricing"
              >
                Upgrade to Premium
              </Link>
            ) : null}
            {showProUpgrade ? (
              <Link
                className={cn(
                  "w-full sm:w-auto",
                  buttonVariants({ size: "lg", variant: "default" })
                )}
                href="/pricing"
              >
                Upgrade to Pro
              </Link>
            ) : null}
            <Link
              className={cn(
                "w-full sm:w-auto",
                buttonVariants({ size: "lg", variant: "outline" })
              )}
              href="/account/billing"
            >
              Manage Billing
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </CardShell>

      <CardShell padding="lg" tone="subtle">
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <Badge tone="gold">Member tools</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              Organize research without trading automation.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Saved ideas, followed tickers, watchlists, and software requests
              are content workflows only. They do not create alerts, broker
              actions, order execution, or copy trading.
            </p>
          </div>
          <Link
            className={cn(
              "w-full sm:w-fit",
              buttonVariants({ size: "lg", variant: "outline" })
            )}
            href="/account"
          >
            Account settings
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>
      </CardShell>
    </div>
  );
}

function DashboardStats({
  closedReviews,
  followedTickers,
  newUpdates,
  savedIdeas,
  softwareAvailable,
  watchlistItems,
}: {
  closedReviews: number;
  followedTickers: number;
  newUpdates: number;
  savedIdeas: number;
  softwareAvailable: number;
  watchlistItems: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardStatCard
        description="Ideas saved to your private member list."
        icon={Bookmark}
        label="Saved Ideas"
        value={String(savedIdeas)}
      />
      <DashboardStatCard
        description="Tickers you follow for related research."
        icon={Eye}
        label="Followed Tickers"
        value={String(followedTickers)}
      />
      <DashboardStatCard
        description="Personal ticker rows in your research watchlist."
        icon={Star}
        label="Watchlist"
        value={String(watchlistItems)}
      />
      <DashboardStatCard
        description="Lifecycle updates since your last saved dashboard marker."
        icon={RefreshCw}
        label="New Updates"
        value={String(newUpdates)}
      />
      <DashboardStatCard
        description="Closed reviews visible through your current access."
        icon={Archive}
        label="Closed Reviews"
        value={String(closedReviews)}
      />
      <DashboardStatCard
        description="Software products available to your current tier."
        icon={Package}
        label="Software"
        value={String(softwareAvailable)}
      />
    </div>
  );
}

function QuickActions() {
  const actions = [
    { href: "/dashboard/saved", label: "Manage saved ideas" },
    { href: "/dashboard/watchlist", label: "Manage watchlist" },
    { href: "/dashboard/following", label: "Manage followed tickers" },
    { href: "/dashboard/software", label: "View software library" },
    { href: "/dashboard/preferences", label: "Update preferences" },
    { href: "/ideas", label: "View all ideas" },
  ];

  return (
    <CardShell padding="md" tone="subtle">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link
            className={cn(
              "w-full justify-between",
              buttonVariants({ size: "lg", variant: "outline" })
            )}
            href={action.href}
            key={action.href}
          >
            {action.label}
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        ))}
      </div>
    </CardShell>
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
    <DashboardSection
      actionHref="/dashboard/recent"
      actionLabel="View recent updates"
      description="Recent lifecycle updates you can access, compared with your saved dashboard marker."
      title="New Since Last Visit"
    >
      <CardShell padding="lg" tone="elevated">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <div>
              <Badge tone="gold">New Since Last Visit</Badge>
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
                This stores only per-user read markers for dashboard recency. It
                does not track trading behavior.
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
                No accessible idea updates are newer than your saved dashboard
                marker.
              </p>
            )}
          </div>
        </div>
      </CardShell>
    </DashboardSection>
  );
}

function DashboardPreferenceSummary({
  preferences,
}: {
  preferences: DashboardPreferenceSettings;
}) {
  const selectedFilters =
    preferences.preferred_asset_classes.length +
    preferences.preferred_statuses.length +
    preferences.preferred_visibility.length;

  return (
    <CardShell padding="lg" tone="subtle">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <Badge tone="muted">Dashboard preferences</Badge>
          <h2 className="mt-3 text-xl font-semibold text-foreground">
            {formatMemberDashboardView(preferences.default_view)} view with{" "}
            {formatMemberSortPreference(preferences.default_sort)} sorting
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Overview widgets respect locked preview visibility, closed reviews,
            software visibility, and {selectedFilters} preferred{" "}
            {selectedFilters === 1 ? "filter" : "filters"} where practical.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Charts on dashboard:{" "}
            {preferences.show_charts_on_dashboard ? "enabled" : "hidden"}.
            Software section:{" "}
            {preferences.show_software_section ? "enabled" : "hidden"}.
          </p>
        </div>
        <Link
          className={cn(
            "w-full sm:w-auto",
            buttonVariants({ size: "lg", variant: "outline" })
          )}
          href="/dashboard/preferences"
        >
          Update preferences
          <Settings data-icon="inline-end" />
        </Link>
      </div>
    </CardShell>
  );
}

function SavedIdeasOverview({ ideas }: { ideas: IdeaPreview[] }) {
  return (
    <DashboardIdeaPreviewSection
      actionHref="/dashboard/saved"
      actionLabel="Manage saved ideas"
      description="Research you saved for later. Locked cards stay safe and preview-only."
      emptyDescription="No saved ideas match your dashboard preferences yet."
      ideas={ideas}
      title="Saved Ideas"
    />
  );
}

function FollowedTickersOverview({
  followedTickerIdeaCards,
  followedTickers,
}: {
  followedTickerIdeaCards: IdeaPreview[];
  followedTickers: MemberDashboardData["followedTickers"];
}) {
  return (
    <DashboardSection
      actionHref="/dashboard/following"
      actionLabel="Manage followed tickers"
      description="Ticker follows organize related research only. No alerts, live prices, or broker actions are created."
      title="Followed Tickers"
    >
      <CardShell padding="md" tone="elevated">
        <div className="grid gap-5">
          {followedTickers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {followedTickers.map((ticker) => (
                <Badge key={ticker.id} tone="gold">
                  {ticker.ticker}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No followed tickers yet.
            </p>
          )}

          {followedTickerIdeaCards.length > 0 ? (
            <div className="grid gap-3">
              {followedTickerIdeaCards.map((idea) => (
                <CompactIdeaLink idea={idea} key={idea.id} />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              actionHref="/ideas"
              actionLabel="Browse ideas"
              description="Follow tickers from idea pages to pull related research into this dashboard."
              framed={false}
              title="No related ideas"
            />
          )}
        </div>
      </CardShell>
    </DashboardSection>
  );
}

function WatchlistOverview({
  items,
}: {
  items: MemberDashboardData["watchlistItems"];
}) {
  return (
    <DashboardSection
      actionHref="/dashboard/watchlist"
      actionLabel="Manage watchlist"
      description="Your personal ticker watchlist with optional idea links. No price feeds or alerts are attached."
      title="Watchlist"
    >
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <CardShell key={item.id} padding="md" tone="elevated">
              <div className="grid gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge tone="gold">{item.ticker}</Badge>
                    {item.note ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                  {item.linkedIdea ? (
                    <Link
                      className="text-sm font-medium text-primary transition hover:text-primary/80"
                      href={`/ideas/${item.linkedIdea.slug}`}
                    >
                      Linked idea
                    </Link>
                  ) : null}
                </div>
                {item.recentIdeas.length > 0 ? (
                  <div className="grid gap-2">
                    {item.recentIdeas.slice(0, 2).map((idea) => (
                      <CompactIdeaLink idea={idea} key={`${item.id}-${idea.id}`} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-border bg-secondary/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    No recent previews match this watchlist ticker yet.
                  </p>
                )}
              </div>
            </CardShell>
          ))}
        </div>
      ) : (
        <DashboardEmptyState
          actionHref="/dashboard/watchlist"
          actionLabel="Add watchlist item"
          description="Your watchlist is empty."
          title="Your watchlist is empty"
        />
      )}
    </DashboardSection>
  );
}

function DashboardIdeaPreviewSection({
  actionHref,
  actionLabel,
  description,
  emptyDescription,
  ideas,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description: string;
  emptyDescription: string;
  ideas: IdeaPreview[];
  title: string;
}) {
  return (
    <DashboardSection
      actionHref={actionHref}
      actionLabel={actionLabel}
      description={description}
      title={title}
    >
      {ideas.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={`${title}-${idea.id}`}
              lockedCtaHref={`/ideas/${idea.slug}`}
              lockedCtaLabel="View safe preview"
              {...idea}
            />
          ))}
        </div>
      ) : (
        <DashboardEmptyState
          actionHref={actionHref}
          actionLabel={actionLabel}
          description={emptyDescription}
          title="No ideas found"
        />
      )}
    </DashboardSection>
  );
}

function CompactIdeaLink({ idea }: { idea: IdeaPreview }) {
  const outcome =
    idea.status === "closed" && !idea.is_locked && idea.outcome !== "pending"
      ? idea.outcome
      : null;

  return (
    <Link
      className="group rounded-lg border border-border bg-secondary/24 p-4 transition-colors hover:bg-secondary/40"
      href={`/ideas/${idea.slug}`}
    >
      <div className="grid gap-3">
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
          <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {idea.title}
          </h3>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {idea.ticker}
          </p>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          {idea.is_locked
            ? "Locked preview only. Full thesis, levels, lifecycle notes, and chart details remain protected."
            : `Updated ${formatLifecycleDate(idea.last_lifecycle_event_at ?? idea.updated_at)}`}
        </p>
      </div>
    </Link>
  );
}

function DashboardSoftwareSection({
  summary,
}: {
  summary: SoftwareSummary;
}) {
  if (!summary.canViewSoftware) {
    return (
      <DashboardSection
        actionHref="/dashboard/software"
        actionLabel="View software library"
        description="Free members can see the locked software page. Software details require Premium or Pro access."
        title="Software Library"
      >
        <CardShell padding="lg" tone="elevated">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="gold">Locked</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                Software access is available to Premium and Pro members.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Software is educational research tooling. It is not financial
                advice, trade execution, or a guarantee of results.
              </p>
            </div>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "default" }))}
              href="/pricing"
            >
              View access options
            </Link>
          </div>
        </CardShell>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      actionHref="/dashboard/software"
      actionLabel="View software library"
      description={
        summary.isAdmin
          ? "Admin users can review all software records from the member dashboard."
          : summary.userTier === "pro"
            ? "Pro members can access Lite and Pro software documentation and manual request workflows."
            : "Premium members can access Lite software documentation and manual request workflows."
      }
      title="Software Library"
    >
      {summary.products.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {summary.products.slice(0, 3).map((product) => (
            <SoftwareCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <DashboardEmptyState
          actionHref="/dashboard/software"
          actionLabel="Open software library"
          description="No software products are available for your current tier yet."
          title="No software available"
        />
      )}
    </DashboardSection>
  );
}

function DashboardDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/35 p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
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
