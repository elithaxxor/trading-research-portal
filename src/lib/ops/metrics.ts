import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getOpsEventCounts, listOpsEvents } from "./events";
import { listIncidents } from "./incidents";
import { listReadinessChecks, getReadinessSummary } from "./readiness";
import type {
  AdminDetailedMetrics,
  AdminOpsOverview,
  BillingMetrics,
  ContentMetrics,
  EmailMetrics,
  MemberMetrics,
  MetricBucket,
  SoftwareMetrics,
  SystemRouteHealthSummary,
} from "./types";

const RECENT_METRICS_WINDOW_DAYS = 14;

function throwMetricsError(): never {
  throw new Error("Unable to load operations metrics.");
}

function bucketize(values: Array<string | boolean | null | undefined>) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const label =
      value === null || value === undefined || value === ""
        ? "unknown"
        : String(value);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ count, label }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function countWhere<T>(items: T[], predicate: (item: T) => boolean) {
  return items.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

function isRecent(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getTime() >=
      Date.now() - RECENT_METRICS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
}

export async function getContentMetrics(): Promise<ContentMetrics> {
  const supabase = await createSupabaseServerClient();
  const [ideasResult, postsResult, updatesResult] = await Promise.all([
    supabase
      .from("trading_ideas")
      .select("id,published,visibility,status,review_published"),
    supabase.from("posts").select("id,published"),
    supabase.from("idea_updates").select("id", { count: "exact", head: true }),
  ]);

  if (ideasResult.error || postsResult.error || updatesResult.error) {
    throwMetricsError();
  }

  const ideas = ideasResult.data ?? [];
  const posts = postsResult.data ?? [];

  return {
    draftIdeas: countWhere(ideas, (idea) => !idea.published),
    ideaUpdates: updatesResult.count ?? 0,
    ideasByStatus: bucketize(ideas.map((idea) => idea.status)),
    ideasByVisibility: bucketize(ideas.map((idea) => idea.visibility)),
    publishedIdeas: countWhere(ideas, (idea) => idea.published),
    publishedPosts: countWhere(posts, (post) => post.published),
    reviewPublishedIdeas: countWhere(ideas, (idea) => idea.review_published),
    totalIdeas: ideas.length,
    totalPosts: posts.length,
  };
}

export async function getMemberMetrics(): Promise<MemberMetrics> {
  const supabase = await createSupabaseServerClient();
  const [profilesResult, subscriptionsResult] = await Promise.all([
    supabase.from("profiles").select("id,role"),
    supabase.from("subscriptions").select("id,status,tier"),
  ]);

  if (profilesResult.error || subscriptionsResult.error) {
    throwMetricsError();
  }

  const profiles = profilesResult.data ?? [];
  const subscriptions = subscriptionsResult.data ?? [];

  return {
    activePaidSubscriptions: countWhere(
      subscriptions,
      (subscription) =>
        subscription.status === "active" && subscription.tier !== "free"
    ),
    admins: countWhere(profiles, (profile) => profile.role === "admin"),
    members: countWhere(profiles, (profile) => profile.role !== "admin"),
    profiles: profiles.length,
    trialingSubscriptions: countWhere(
      subscriptions,
      (subscription) =>
        subscription.status === "trialing" && subscription.tier !== "free"
    ),
  };
}

export async function getBillingMetrics(): Promise<BillingMetrics> {
  const supabase = await createSupabaseServerClient();
  const [subscriptionsResult, checkoutResult, webhookResult] =
    await Promise.all([
      supabase.from("subscriptions").select("id,status,tier"),
      supabase
        .from("stripe_checkout_sessions")
        .select("id,payment_status,status"),
      supabase.from("stripe_webhook_events").select("stripe_event_id,processing_status"),
    ]);

  if (
    subscriptionsResult.error ||
    checkoutResult.error ||
    webhookResult.error
  ) {
    throwMetricsError();
  }

  const subscriptions = subscriptionsResult.data ?? [];
  const checkoutSessions = checkoutResult.data ?? [];
  const webhookEvents = webhookResult.data ?? [];

  return {
    checkoutSessionsByPaymentStatus: bucketize(
      checkoutSessions.map(
        (session) => session.payment_status ?? session.status ?? "unknown"
      )
    ),
    subscriptionsByStatus: bucketize(
      subscriptions.map((subscription) => subscription.status)
    ),
    subscriptionsByTier: bucketize(
      subscriptions.map((subscription) => subscription.tier)
    ),
    webhookEventsByStatus: bucketize(
      webhookEvents.map((event) => event.processing_status)
    ),
  };
}

export async function getEmailMetrics(): Promise<EmailMetrics> {
  const supabase = await createSupabaseServerClient();
  const [notificationsResult, providerEventsResult, digestRunsResult] =
    await Promise.all([
      supabase.from("email_notifications").select("id,status,category"),
      supabase.from("email_provider_events").select("id,event_type"),
      supabase.from("email_digest_runs").select("id,status"),
    ]);

  if (
    notificationsResult.error ||
    providerEventsResult.error ||
    digestRunsResult.error
  ) {
    throwMetricsError();
  }

  const notifications = notificationsResult.data ?? [];
  const providerEvents = providerEventsResult.data ?? [];
  const digestRuns = digestRunsResult.data ?? [];

  return {
    digestRunsByStatus: bucketize(digestRuns.map((run) => run.status)),
    notificationsByCategory: bucketize(
      notifications.map((notification) => notification.category)
    ),
    notificationsByStatus: bucketize(
      notifications.map((notification) => notification.status)
    ),
    providerEventsByType: bucketize(
      providerEvents.map((event) => event.event_type)
    ),
  };
}

export async function getSoftwareMetrics(): Promise<SoftwareMetrics> {
  const supabase = await createSupabaseServerClient();
  const [productsResult, requestsResult] = await Promise.all([
    supabase.from("software_products").select("id,published,access_tier"),
    supabase.from("software_access_requests").select("id,status"),
  ]);

  if (productsResult.error || requestsResult.error) {
    throwMetricsError();
  }

  const products = productsResult.data ?? [];
  const requests = requestsResult.data ?? [];

  return {
    accessRequestsByStatus: bucketize(requests.map((request) => request.status)),
    productsByTier: bucketize(products.map((product) => product.access_tier)),
    publishedProducts: countWhere(products, (product) => product.published),
    totalProducts: products.length,
  };
}

export async function getSystemRouteHealthSummary(): Promise<SystemRouteHealthSummary> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [checks, incidents, recentEvents] = await Promise.all([
    listReadinessChecks(),
    listIncidents(),
    listOpsEvents({ limit: 1000, since }),
  ]);
  const routeCounts = new Map<string, number>();

  for (const event of recentEvents) {
    if (event.route) {
      routeCounts.set(event.route, (routeCounts.get(event.route) ?? 0) + 1);
    }
  }

  return {
    appHealthChecks: checks.filter((check) => check.category === "app_health"),
    deploymentChecks: checks.filter((check) => check.category === "deployment"),
    openIncidents: countWhere(incidents, (incident) => !incident.resolved_at),
    routeEventCounts: Array.from(routeCounts.entries())
      .map(([label, count]) => ({ count, label }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  };
}

export async function getAdminOpsOverview(): Promise<AdminOpsOverview> {
  const [
    billing,
    content,
    email,
    members,
    readiness,
    software,
    system,
  ] = await Promise.all([
    getBillingMetrics(),
    getContentMetrics(),
    getEmailMetrics(),
    getMemberMetrics(),
    getReadinessSummary(),
    getSoftwareMetrics(),
    getSystemRouteHealthSummary(),
  ]);

  return {
    billing,
    content,
    email,
    generatedAt: new Date().toISOString(),
    members,
    readiness,
    software,
    system,
  };
}

export async function getAdminDetailedMetrics(): Promise<AdminDetailedMetrics> {
  const supabase = await createSupabaseServerClient();
  const since = new Date(
    Date.now() - RECENT_METRICS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    ideasResult,
    postsResult,
    profilesResult,
    subscriptionsResult,
    softwareProductsResult,
    softwareRequestsResult,
    checkoutSessionsResult,
    webhookEventsResult,
    emailNotificationsResult,
    digestRunsResult,
    incidentsResult,
    readinessResult,
    opsEventsResult,
  ] = await Promise.all([
    supabase
      .from("trading_ideas")
      .select("id,published,review_published,updated_at,visibility"),
    supabase.from("posts").select("id,published"),
    supabase.from("profiles").select("id,created_at,role"),
    supabase.from("subscriptions").select("id,status,tier,user_id"),
    supabase.from("software_products").select("id,access_tier,published"),
    supabase.from("software_access_requests").select("id,status"),
    supabase.from("stripe_checkout_sessions").select("id,created_at"),
    supabase.from("stripe_webhook_events").select("stripe_event_id,processing_status"),
    supabase.from("email_notifications").select("id,status"),
    supabase.from("email_digest_runs").select("id,status"),
    supabase.from("ops_incidents").select("id,status,resolved_at"),
    supabase.from("ops_readiness_checks").select("id,status,blocking_launch"),
    supabase.from("ops_events").select("id,route").gte("created_at", since),
  ]);

  if (
    ideasResult.error ||
    postsResult.error ||
    profilesResult.error ||
    subscriptionsResult.error ||
    softwareProductsResult.error ||
    softwareRequestsResult.error ||
    checkoutSessionsResult.error ||
    webhookEventsResult.error ||
    emailNotificationsResult.error ||
    digestRunsResult.error ||
    incidentsResult.error ||
    readinessResult.error ||
    opsEventsResult.error
  ) {
    throwMetricsError();
  }

  const ideas = ideasResult.data ?? [];
  const posts = postsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const subscriptions = subscriptionsResult.data ?? [];
  const softwareProducts = softwareProductsResult.data ?? [];
  const softwareRequests = softwareRequestsResult.data ?? [];
  const checkoutSessions = checkoutSessionsResult.data ?? [];
  const webhookEvents = webhookEventsResult.data ?? [];
  const emailNotifications = emailNotificationsResult.data ?? [];
  const digestRuns = digestRunsResult.data ?? [];
  const incidents = incidentsResult.data ?? [];
  const readinessChecks = readinessResult.data ?? [];
  const opsEvents = opsEventsResult.data ?? [];
  const activeSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "active" || subscription.status === "trialing"
  );
  const activePaidSubscriptions = activeSubscriptions.filter(
    (subscription) =>
      subscription.tier === "premium" || subscription.tier === "pro"
  );
  const activePaidUserIds = new Set(
    activePaidSubscriptions.map((subscription) => subscription.user_id)
  );
  const memberProfiles = profiles.filter((profile) => profile.role !== "admin");

  return {
    adminOps: {
      blockedReadinessChecks: countWhere(
        readinessChecks,
        (check) =>
          check.blocking_launch &&
          check.status !== "passing" &&
          check.status !== "skipped"
      ),
      launchBlockingChecks: countWhere(
        readinessChecks,
        (check) => check.blocking_launch
      ),
      openIncidents: countWhere(
        incidents,
        (incident) =>
          !incident.resolved_at &&
          incident.status !== "resolved" &&
          incident.status !== "closed"
      ),
      readinessChecks: readinessChecks.length,
    },
    billing: {
      activePremiumCount: countWhere(
        activeSubscriptions,
        (subscription) => subscription.tier === "premium"
      ),
      activeProCount: countWhere(
        activeSubscriptions,
        (subscription) => subscription.tier === "pro"
      ),
      canceledCount: countWhere(
        subscriptions,
        (subscription) => subscription.status === "canceled"
      ),
      pastDueCount: countWhere(
        subscriptions,
        (subscription) => subscription.status === "past_due"
      ),
      recentCheckoutSessions: countWhere(checkoutSessions, (session) =>
        isRecent(session.created_at)
      ),
      webhookFailures: countWhere(
        webhookEvents,
        (event) => event.processing_status === "failed"
      ),
    },
    content: {
      closedReviews: countWhere(ideas, (idea) => idea.review_published),
      premiumProIdeas: countWhere(
        ideas,
        (idea) => idea.visibility === "premium" || idea.visibility === "pro"
      ),
      publishedIdeas: countWhere(ideas, (idea) => idea.published),
      recentlyUpdatedIdeas: countWhere(ideas, (idea) =>
        isRecent(idea.updated_at)
      ),
      researchPosts: posts.length,
      totalIdeas: ideas.length,
    },
    email: {
      bounced: countWhere(
        emailNotifications,
        (notification) => notification.status === "bounced"
      ),
      complained: countWhere(
        emailNotifications,
        (notification) => notification.status === "complained"
      ),
      delivered: countWhere(
        emailNotifications,
        (notification) => notification.status === "delivered"
      ),
      digestRuns: digestRuns.length,
      failed: countWhere(
        emailNotifications,
        (notification) => notification.status === "failed"
      ),
      queued: countWhere(
        emailNotifications,
        (notification) => notification.status === "queued"
      ),
      sent: countWhere(
        emailNotifications,
        (notification) => notification.status === "sent"
      ),
      suppressed: countWhere(
        emailNotifications,
        (notification) => notification.status === "suppressed"
      ),
    },
    generatedAt: new Date().toISOString(),
    members: {
      activeFreeSubscriptions: countWhere(
        memberProfiles,
        (profile) => !activePaidUserIds.has(profile.id)
      ),
      activePremiumSubscriptions: countWhere(
        activeSubscriptions,
        (subscription) => subscription.tier === "premium"
      ),
      activeProSubscriptions: countWhere(
        activeSubscriptions,
        (subscription) => subscription.tier === "pro"
      ),
      dashboardActivityCount: countWhere(
        opsEvents,
        (event) =>
          event.route?.startsWith("/dashboard") === true ||
          event.route?.startsWith("/account") === true
      ),
      recentSignups: countWhere(memberProfiles, (profile) =>
        isRecent(profile.created_at)
      ),
      totalProfiles: profiles.length,
    },
    recentWindowDays: RECENT_METRICS_WINDOW_DAYS,
    software: {
      grantedAccessRequests: countWhere(
        softwareRequests,
        (request) => request.status === "granted"
      ),
      openAccessRequests: countWhere(softwareRequests, (request) =>
        ["requested", "needs_info", "approved"].includes(request.status)
      ),
      publishedLiteSoftware: countWhere(
        softwareProducts,
        (product) =>
          product.published && product.access_tier === "premium_lite"
      ),
      publishedProSoftware: countWhere(
        softwareProducts,
        (product) => product.published && product.access_tier === "pro"
      ),
      revokedRejectedRequests: countWhere(softwareRequests, (request) =>
        ["revoked", "rejected"].includes(request.status)
      ),
    },
  };
}

export async function getRecentOpsEventCounts(): Promise<MetricBucket[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const counts = await getOpsEventCounts({ since });

  return counts.map((item) => ({
    count: item.count,
    label: item.eventName,
  }));
}
