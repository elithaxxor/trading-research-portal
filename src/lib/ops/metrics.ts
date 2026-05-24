import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getOpsEventCounts, listOpsEvents } from "./events";
import { listIncidents } from "./incidents";
import { listReadinessChecks, getReadinessSummary } from "./readiness";
import type {
  AdminOpsOverview,
  BillingMetrics,
  ContentMetrics,
  EmailMetrics,
  MemberMetrics,
  MetricBucket,
  SoftwareMetrics,
  SystemRouteHealthSummary,
} from "./types";

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

export async function getRecentOpsEventCounts(): Promise<MetricBucket[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const counts = await getOpsEventCounts({ since });

  return counts.map((item) => ({
    count: item.count,
    label: item.eventName,
  }));
}
