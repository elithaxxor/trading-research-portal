import "server-only";

import type { OpsCheckCategory, OpsCheckStatus } from "./types";

const statusLabels: Record<OpsCheckStatus, string> = {
  blocked: "Blocked",
  failing: "Failing",
  passing: "Passing",
  pending: "Pending",
  skipped: "Skipped",
  warning: "Warning",
};

const categoryLabels: Record<OpsCheckCategory, string> = {
  analytics: "Analytics",
  app_health: "App Health",
  auth: "Auth",
  billing: "Billing",
  content: "Content",
  database: "Database",
  deployment: "Deployment",
  email: "Email",
  launch: "Launch",
  legal: "Legal",
  security: "Security",
  software: "Software",
};

export function formatOpsCheckStatus(status: OpsCheckStatus): string {
  return statusLabels[status];
}

export function formatOpsCategory(category: OpsCheckCategory): string {
  return categoryLabels[category];
}

export function formatIncidentSeverity(severity: string): string {
  const normalized = severity.trim().toLowerCase();

  if (!normalized) {
    return "Low";
  }

  return `${normalized.slice(0, 1).toUpperCase()}${normalized.slice(1)}`;
}

export function formatMetricLabel(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function formatMetricDate(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
