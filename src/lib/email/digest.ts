import "server-only";

import { getEffectiveSubscriptionTier } from "@/lib/billing/tiers";
import { canAccessVisibility } from "@/lib/content/access";
import { formatVisibilityLabel } from "@/lib/content/format";
import { isFeatureEnabled } from "@/lib/flags/server";
import { canAccessSoftwareTier } from "@/lib/software/access";
import { formatSoftwareAccessTier } from "@/lib/software/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

import { hasUserUnsubscribed, isEmailSuppressed } from "./eligibility";
import { queueEmailNotification } from "./queue";
import {
  assertNoPrivateMarkersForUnauthorizedEmail,
  buildProtectedAppLink,
  createSafePreviewText,
} from "./safety";
import {
  renderWeeklyDigestEmail,
  type WeeklyDigestItem,
} from "./templates/weekly-digest";
import type {
  ContentVisibility,
  SubscriptionStatus,
  SubscriptionTier,
} from "./types";

type AppRole = Database["public"]["Enums"]["app_role"];
type IdeaUpdate = Database["public"]["Tables"]["idea_updates"]["Row"];
type NotificationPreferences =
  Database["public"]["Tables"]["notification_preferences"]["Row"];
type Post = Database["public"]["Tables"]["posts"]["Row"];
type SoftwareProduct = Database["public"]["Tables"]["software_products"]["Row"];
type TradingIdea = Database["public"]["Tables"]["trading_ideas"]["Row"];

type DigestUser = {
  email: string;
  preferences: NotificationPreferences;
  role: AppRole;
  status: SubscriptionStatus | null;
  tier: SubscriptionTier | null;
  userId: string;
};

type DigestWindow = {
  since: Date | string;
  until: Date | string;
};

export type WeeklyDigestSummary = {
  closedReviews: WeeklyDigestItem[];
  lifecycleUpdates: WeeklyDigestItem[];
  majorUpdates: WeeklyDigestItem[];
  newIdeas: WeeklyDigestItem[];
  newResearchPosts: WeeklyDigestItem[];
  softwareUpdates: WeeklyDigestItem[];
  userCanAccessSoftwareUpdates: boolean;
};

export type BuildWeeklyDigestResult = WeeklyDigestSummary & {
  email: {
    html: string;
    previewText: string;
    subject: string;
    text: string;
  } | null;
  hasItems: boolean;
  userId: string;
  weekLabel: string;
};

export type QueueWeeklyDigestRunOptions = Partial<DigestWindow> & {
  limit?: number;
  runKey?: string;
};

export type QueueWeeklyDigestRunResult = {
  failed: number;
  queued: number;
  runId: string;
  runKey: string;
  skipped: number;
  totalEligible: number;
};

function toDate(value: Date | string | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid digest date window.");
  }

  return date;
}

function toIso(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function getDefaultDigestWindow(): { since: Date; until: Date } {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(until.getUTCDate() - 7);

  return { since, until };
}

function getWeekLabel(since: Date | string, until: Date | string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return `${formatter.format(new Date(since))} - ${formatter.format(
    new Date(until)
  )}`;
}

function safePreview(value: string | null | undefined, fallback: string) {
  const preview = createSafePreviewText(value || fallback, 150);
  assertNoPrivateMarkersForUnauthorizedEmail(preview);

  return preview;
}

function canAccessContent(
  visibility: ContentVisibility,
  tier: SubscriptionTier,
  role: AppRole
) {
  return canAccessVisibility(visibility, tier, role);
}

function getUserEffectiveTier(user: DigestUser) {
  return getEffectiveSubscriptionTier(
    user.tier,
    user.status,
    user.role === "admin"
  );
}

function createContentLabel(visibility: ContentVisibility, extra?: string) {
  return [formatVisibilityLabel(visibility), extra].filter(Boolean).join(" | ");
}

function ideaToDigestItem(idea: TradingIdea): WeeklyDigestItem {
  return {
    href: buildProtectedAppLink(`/ideas/${idea.slug}`),
    label: createContentLabel(idea.visibility, idea.ticker.toUpperCase()),
    preview: safePreview(
      idea.public_preview ?? idea.summary,
      "A research idea is available in the protected portal."
    ),
    title: idea.title,
  };
}

function postToDigestItem(post: Post): WeeklyDigestItem {
  return {
    href: buildProtectedAppLink(`/research/${post.slug}`),
    label: createContentLabel(post.visibility, "Research"),
    preview: safePreview(
      post.excerpt,
      "A research post is available in the protected portal."
    ),
    title: post.title,
  };
}

function updateToDigestItem(
  update: IdeaUpdate,
  idea: TradingIdea,
  label: string
): WeeklyDigestItem {
  return {
    href: buildProtectedAppLink(`/ideas/${idea.slug}`),
    label: `${idea.ticker.toUpperCase()} | ${label}`,
    preview: safePreview(
      idea.public_preview,
      "An idea update is available in the protected portal."
    ),
    title: update.title,
  };
}

function softwareToDigestItem(product: SoftwareProduct): WeeklyDigestItem {
  return {
    href: buildProtectedAppLink(`/dashboard/software/${product.slug}`),
    label: formatSoftwareAccessTier(product.access_tier),
    preview: safePreview(
      product.short_description,
      "A software library update is available in the portal."
    ),
    title: product.title,
  };
}

function filterByUserAccess<T extends { visibility: ContentVisibility }>(
  items: T[],
  user: DigestUser
) {
  const tier = getUserEffectiveTier(user);

  return items.filter((item) => canAccessContent(item.visibility, tier, user.role));
}

function buildIdeaMap(ideas: TradingIdea[]) {
  return new Map(ideas.map((idea) => [idea.id, idea]));
}

function isLifecycleUpdate(update: IdeaUpdate) {
  return (
    update.event_type !== "note" ||
    Boolean(update.status_after_update) ||
    Boolean(update.outcome_after)
  );
}

function clampLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit)) {
    return null;
  }

  return Math.max(1, Math.min(500, Math.floor(limit)));
}

async function getDigestUser(userId: string): Promise<DigestUser | null> {
  const supabase = createSupabaseAdminClient();
  const [profileResult, subscriptionResult, preferencesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (
    profileResult.error ||
    subscriptionResult.error ||
    preferencesResult.error ||
    !profileResult.data?.email ||
    !preferencesResult.data?.email_enabled ||
    !preferencesResult.data.weekly_digest
  ) {
    return null;
  }

  return {
    email: profileResult.data.email,
    preferences: preferencesResult.data,
    role: profileResult.data.role,
    status: subscriptionResult.data?.status ?? null,
    tier: subscriptionResult.data?.tier ?? null,
    userId,
  };
}

async function loadDigestSourceData(since: Date | string, until: Date | string) {
  const supabase = createSupabaseAdminClient();
  const sinceIso = toIso(since);
  const untilIso = toIso(until);
  const [
    newIdeasResult,
    ideaUpdatesResult,
    recentlyReviewedIdeasResult,
    postsResult,
    softwareResult,
  ] = await Promise.all([
    supabase
      .from("trading_ideas")
      .select("*")
      .eq("published", true)
      .gte("published_at", sinceIso)
      .lt("published_at", untilIso)
      .order("published_at", { ascending: false }),
    supabase
      .from("idea_updates")
      .select("*")
      .gte("event_at", sinceIso)
      .lt("event_at", untilIso)
      .order("event_at", { ascending: false }),
    supabase
      .from("trading_ideas")
      .select("*")
      .eq("published", true)
      .eq("review_published", true)
      .gte("review_published_at", sinceIso)
      .lt("review_published_at", untilIso)
      .order("review_published_at", { ascending: false }),
    supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .gte("published_at", sinceIso)
      .lt("published_at", untilIso)
      .order("published_at", { ascending: false }),
    supabase
      .from("software_products")
      .select("*")
      .eq("published", true)
      .gte("updated_at", sinceIso)
      .lt("updated_at", untilIso)
      .order("updated_at", { ascending: false }),
  ]);

  if (
    newIdeasResult.error ||
    ideaUpdatesResult.error ||
    recentlyReviewedIdeasResult.error ||
    postsResult.error ||
    softwareResult.error
  ) {
    throw new Error("Unable to load weekly digest source data.");
  }

  const updates = ideaUpdatesResult.data ?? [];
  const ideaIds = Array.from(new Set(updates.map((update) => update.idea_id)));
  const updateIdeasResult =
    ideaIds.length > 0
      ? await supabase
          .from("trading_ideas")
          .select("*")
          .eq("published", true)
          .in("id", ideaIds)
      : { data: [] as TradingIdea[], error: null };

  if (updateIdeasResult.error) {
    throw new Error("Unable to load weekly digest idea update parents.");
  }

  return {
    newIdeas: newIdeasResult.data ?? [],
    posts: postsResult.data ?? [],
    reviewedIdeas: recentlyReviewedIdeasResult.data ?? [],
    softwareProducts: softwareResult.data ?? [],
    updateIdeas: updateIdeasResult.data ?? [],
    updates,
  };
}

export function createDigestRunKey(window: Date | string | DigestWindow) {
  if (typeof window === "string" || window instanceof Date) {
    return `weekly-digest:${toIso(window).slice(0, 10)}`;
  }

  return `weekly-digest:${toIso(window.since)}:${toIso(window.until)}`;
}

export async function getDigestEligibleUsers(): Promise<DigestUser[]> {
  const supabase = createSupabaseAdminClient();
  const [profilesResult, subscriptionsResult, preferencesResult] =
    await Promise.all([
      supabase.from("profiles").select("*").not("email", "is", null),
      supabase.from("subscriptions").select("*"),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("email_enabled", true)
        .eq("weekly_digest", true),
    ]);

  if (
    profilesResult.error ||
    subscriptionsResult.error ||
    preferencesResult.error
  ) {
    throw new Error("Unable to load weekly digest recipients.");
  }

  const subscriptionsByUser = new Map(
    (subscriptionsResult.data ?? []).map((subscription) => [
      subscription.user_id,
      subscription,
    ])
  );
  const preferencesByUser = new Map(
    (preferencesResult.data ?? []).map((preferences) => [
      preferences.user_id,
      preferences,
    ])
  );
  const recipients: DigestUser[] = [];

  for (const profile of profilesResult.data ?? []) {
    if (!profile.email) {
      continue;
    }

    const preferences = preferencesByUser.get(profile.id);

    if (!preferences) {
      continue;
    }

    if (
      (await isEmailSuppressed(profile.email)) ||
      (await hasUserUnsubscribed(profile.email, "weekly_digest"))
    ) {
      continue;
    }

    const subscription = subscriptionsByUser.get(profile.id) ?? null;
    recipients.push({
      email: profile.email,
      preferences,
      role: profile.role,
      status: subscription?.status ?? null,
      tier: subscription?.tier ?? null,
      userId: profile.id,
    });
  }

  return recipients;
}

export async function buildWeeklyDigestForUser(
  userId: string,
  since: Date | string,
  until: Date | string
): Promise<BuildWeeklyDigestResult | null> {
  const user = await getDigestUser(userId);

  if (!user) {
    return null;
  }

  const source = await loadDigestSourceData(since, until);
  const ideaMap = buildIdeaMap(source.updateIdeas);
  const accessibleNewIdeas = filterByUserAccess(source.newIdeas, user);
  const accessiblePosts = filterByUserAccess(source.posts, user);
  const accessibleReviewedIdeas = filterByUserAccess(source.reviewedIdeas, user);
  const accessibleUpdates = source.updates
    .map((update) => ({ idea: ideaMap.get(update.idea_id), update }))
    .filter((item): item is { idea: TradingIdea; update: IdeaUpdate } => {
      const idea = item.idea;

      return Boolean(
        idea &&
          canAccessContent(idea.visibility, getUserEffectiveTier(user), user.role)
      );
    });
  const userTier = getUserEffectiveTier(user);
  const accessibleSoftware = source.softwareProducts.filter((product) =>
    canAccessSoftwareTier(
      product.access_tier,
      userTier,
      user.role === "admin"
    )
  );
  const summary: WeeklyDigestSummary = {
    closedReviews: accessibleReviewedIdeas.map((idea) => ({
      ...ideaToDigestItem(idea),
      label: createContentLabel(idea.visibility, "Closed review"),
    })),
    lifecycleUpdates: accessibleUpdates
      .filter(({ update }) => isLifecycleUpdate(update) && !update.is_major)
      .map(({ idea, update }) =>
        updateToDigestItem(update, idea, "Lifecycle update")
      ),
    majorUpdates: accessibleUpdates
      .filter(({ update }) => update.is_major)
      .map(({ idea, update }) => updateToDigestItem(update, idea, "Major update")),
    newIdeas: accessibleNewIdeas.map(ideaToDigestItem),
    newResearchPosts: accessiblePosts.map(postToDigestItem),
    softwareUpdates: accessibleSoftware.map(softwareToDigestItem),
    userCanAccessSoftwareUpdates: accessibleSoftware.length > 0,
  };
  const hasItems = Object.values(summary).some((value) =>
    Array.isArray(value) ? value.length > 0 : false
  );
  const weekLabel = getWeekLabel(since, until);

  return {
    ...summary,
    email: hasItems
      ? renderWeeklyDigestEmail({
          closedReviews: summary.closedReviews,
          lifecycleUpdates: summary.lifecycleUpdates,
          majorUpdates: summary.majorUpdates,
          newIdeas: summary.newIdeas,
          newResearchPosts: summary.newResearchPosts,
          preferenceUrl: buildProtectedAppLink("/account/notifications"),
          softwareUpdates: summary.softwareUpdates,
          userCanAccessSoftwareUpdates: summary.userCanAccessSoftwareUpdates,
          weekLabel,
        })
      : null,
    hasItems,
    userId,
    weekLabel,
  };
}

export async function summarizeDigestItemsForUser(userId: string) {
  const { since, until } = getDefaultDigestWindow();

  return buildWeeklyDigestForUser(userId, since, until);
}

export async function queueWeeklyDigestRun(
  options: QueueWeeklyDigestRunOptions = {}
): Promise<QueueWeeklyDigestRunResult> {
  if (!isFeatureEnabled("weekly_digest_enabled")) {
    throw new Error("Weekly digest queueing is disabled by launch controls.");
  }

  const defaultWindow = getDefaultDigestWindow();
  const since = toDate(options.since, defaultWindow.since);
  const until = toDate(options.until, defaultWindow.until);
  const runKey = options.runKey ?? createDigestRunKey({ since, until });
  const supabase = createSupabaseAdminClient();
  const { data: run, error: runError } = await supabase
    .from("email_digest_runs")
    .upsert(
      {
        metadata: {
          since: since.toISOString(),
          until: until.toISOString(),
        },
        run_key: runKey,
        status: "started",
      },
      { onConflict: "run_key" }
    )
    .select("*")
    .single();

  if (runError) {
    throw new Error("Unable to create weekly digest run.");
  }

  const eligibleUsers = await getDigestEligibleUsers();
  const limit = clampLimit(options.limit);
  const users = limit ? eligibleUsers.slice(0, limit) : eligibleUsers;
  let queued = 0;
  let skipped = eligibleUsers.length - users.length;
  let failed = 0;

  for (const user of users) {
    try {
      const digest = await buildWeeklyDigestForUser(user.userId, since, until);

      if (!digest?.email || !digest.hasItems) {
        skipped += 1;
        continue;
      }

      await queueEmailNotification({
        category: "digest",
        contentId: run.id,
        contentType: "weekly_digest",
        dedupeKey: `${runKey}:${user.userId}:weekly_digest`,
        htmlBody: digest.email.html,
        metadata: {
          run_id: run.id,
          run_key: runKey,
          since: since.toISOString(),
          until: until.toISOString(),
        },
        notificationType: "weekly_digest",
        previewText: digest.email.previewText,
        recipientEmail: user.email,
        subject: digest.email.subject,
        templateKey: "weekly-digest",
        textBody: digest.email.text,
        unsubscribeGroup: "weekly_digest",
        userId: user.userId,
      });
      queued += 1;
    } catch (error) {
      failed += 1;
      console.error("Unable to queue weekly digest email.", {
        error: error instanceof Error ? error.message : "Unknown digest error",
        runKey,
        userId: user.userId,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("email_digest_runs")
    .update({
      completed_at: new Date().toISOString(),
      failed_count: failed,
      recipient_count: eligibleUsers.length,
      sent_count: 0,
      skipped_count: skipped,
      status: failed > 0 ? "completed_with_errors" : "completed",
    })
    .eq("id", run.id);

  if (updateError) {
    throw new Error("Unable to update weekly digest run.");
  }

  return {
    failed,
    queued,
    runId: run.id,
    runKey,
    skipped,
    totalEligible: eligibleUsers.length,
  };
}
