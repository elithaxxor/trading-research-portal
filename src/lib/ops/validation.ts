import "server-only";

import type {
  IncidentSeverity,
  OpsCheckCategory,
  OpsCheckStatus,
} from "./types";
import {
  incidentSeverityValues,
  opsCheckCategoryValues,
  opsCheckStatusValues,
} from "./types";
import {
  assertNoPrivateContentInOpsMetadata,
  stripSecretsFromMetadata,
} from "./safety";

function isOneOf<T extends string>(
  value: unknown,
  values: readonly T[]
): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export function validateReadinessStatus(value: unknown): OpsCheckStatus {
  if (isOneOf(value, opsCheckStatusValues)) {
    return value;
  }

  throw new Error("Invalid readiness status.");
}

export function validateReadinessCategory(value: unknown): OpsCheckCategory {
  if (isOneOf(value, opsCheckCategoryValues)) {
    return value;
  }

  throw new Error("Invalid readiness category.");
}

export function validateIncidentSeverity(value: unknown): IncidentSeverity {
  if (value === undefined || value === null || value === "") {
    return "low";
  }

  if (isOneOf(value, incidentSeverityValues)) {
    return value;
  }

  throw new Error("Invalid incident severity.");
}

export function validateOpsEventName(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Invalid ops event name.");
  }

  const normalized = value.trim();

  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,95}$/.test(normalized)) {
    throw new Error("Invalid ops event name.");
  }

  return normalized;
}

export function validateSafeMetadata(input: unknown) {
  const metadata = stripSecretsFromMetadata(input);

  assertNoPrivateContentInOpsMetadata(metadata);

  return metadata;
}
