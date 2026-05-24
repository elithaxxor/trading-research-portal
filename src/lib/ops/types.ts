import "server-only";

import type { Database, Json } from "@/types/database.types";

export type OpsCheckStatus =
  Database["public"]["Enums"]["ops_check_status"];
export type OpsCheckCategory =
  Database["public"]["Enums"]["ops_check_category"];
export type AnalyticsEventSource =
  Database["public"]["Enums"]["analytics_event_source"];

export type OpsReadinessCheck =
  Database["public"]["Tables"]["ops_readiness_checks"]["Row"];
export type OpsEvent = Database["public"]["Tables"]["ops_events"]["Row"];
export type OpsIncident =
  Database["public"]["Tables"]["ops_incidents"]["Row"];
export type AdminAuditNote =
  Database["public"]["Tables"]["admin_audit_notes"]["Row"];

export type SafeOpsMetadata = Json;

export const opsCheckStatusValues = [
  "pending",
  "passing",
  "warning",
  "failing",
  "blocked",
  "skipped",
] as const satisfies readonly OpsCheckStatus[];

export const opsCheckCategoryValues = [
  "app_health",
  "auth",
  "database",
  "content",
  "billing",
  "email",
  "software",
  "security",
  "legal",
  "deployment",
  "analytics",
  "launch",
] as const satisfies readonly OpsCheckCategory[];

export const analyticsEventSourceValues = [
  "server",
  "client",
  "webhook",
  "admin",
  "system",
] as const satisfies readonly AnalyticsEventSource[];

export const incidentSeverityValues = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type IncidentSeverity = (typeof incidentSeverityValues)[number];

export type ReadinessSummary = {
  blockingLaunchCount: number;
  blockingOpenCount: number;
  byCategory: Record<OpsCheckCategory, number>;
  byStatus: Record<OpsCheckStatus, number>;
  launchBlocked: boolean;
  total: number;
};

export type UpdateReadinessCheckInput = {
  blockingLaunch?: boolean;
  category?: OpsCheckCategory;
  description?: string | null;
  dueAt?: string | null;
  evidenceNote?: string | null;
  evidenceUrl?: string | null;
  lastCheckedAt?: string | null;
  metadata?: unknown;
  owner?: string | null;
  status?: OpsCheckStatus;
  title?: string;
};

export type UpsertReadinessCheckInput = UpdateReadinessCheckInput & {
  category: OpsCheckCategory;
  title: string;
};

export type RecordOpsEventInput = {
  entityId?: string | null;
  entityType?: string | null;
  eventName: string;
  metadata?: unknown;
  route?: string | null;
  sessionId?: string | null;
  source?: AnalyticsEventSource;
  userId?: string | null;
};

export type ListOpsEventsParams = {
  entityId?: string;
  entityType?: string;
  eventName?: string;
  limit?: number;
  offset?: number;
  route?: string;
  since?: string;
  source?: AnalyticsEventSource;
  until?: string;
  userId?: string;
};

export type OpsEventCount = {
  count: number;
  eventName: string;
};

export type CreateIncidentInput = {
  affectedArea?: string | null;
  metadata?: unknown;
  severity?: IncidentSeverity;
  startedAt?: string;
  status?: string;
  summary?: string | null;
  title: string;
};

export type UpdateIncidentInput = Partial<CreateIncidentInput> & {
  resolvedAt?: string | null;
  resolutionNote?: string | null;
};

export type MetricBucket = {
  count: number;
  label: string;
};

export type ContentMetrics = {
  draftIdeas: number;
  ideaUpdates: number;
  ideasByStatus: MetricBucket[];
  ideasByVisibility: MetricBucket[];
  publishedIdeas: number;
  publishedPosts: number;
  reviewPublishedIdeas: number;
  totalIdeas: number;
  totalPosts: number;
};

export type MemberMetrics = {
  activePaidSubscriptions: number;
  admins: number;
  members: number;
  profiles: number;
  trialingSubscriptions: number;
};

export type BillingMetrics = {
  checkoutSessionsByPaymentStatus: MetricBucket[];
  subscriptionsByStatus: MetricBucket[];
  subscriptionsByTier: MetricBucket[];
  webhookEventsByStatus: MetricBucket[];
};

export type EmailMetrics = {
  digestRunsByStatus: MetricBucket[];
  notificationsByCategory: MetricBucket[];
  notificationsByStatus: MetricBucket[];
  providerEventsByType: MetricBucket[];
};

export type SoftwareMetrics = {
  accessRequestsByStatus: MetricBucket[];
  productsByTier: MetricBucket[];
  publishedProducts: number;
  totalProducts: number;
};

export type SystemRouteHealthSummary = {
  appHealthChecks: OpsReadinessCheck[];
  deploymentChecks: OpsReadinessCheck[];
  openIncidents: number;
  routeEventCounts: MetricBucket[];
};

export type AdminOpsOverview = {
  billing: BillingMetrics;
  content: ContentMetrics;
  email: EmailMetrics;
  generatedAt: string;
  members: MemberMetrics;
  readiness: ReadinessSummary;
  software: SoftwareMetrics;
  system: SystemRouteHealthSummary;
};
