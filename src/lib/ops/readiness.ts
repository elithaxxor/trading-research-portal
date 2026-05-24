import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import type {
  OpsCheckCategory,
  OpsCheckStatus,
  OpsReadinessCheck,
  ReadinessSummary,
  UpdateReadinessCheckInput,
  UpsertReadinessCheckInput,
} from "./types";
import { opsCheckCategoryValues, opsCheckStatusValues } from "./types";
import {
  validateReadinessCategory,
  validateReadinessStatus,
  validateSafeMetadata,
} from "./validation";

type ReadinessInsert =
  Database["public"]["Tables"]["ops_readiness_checks"]["Insert"];
type ReadinessUpdate =
  Database["public"]["Tables"]["ops_readiness_checks"]["Update"];

function throwReadinessError(): never {
  throw new Error("Unable to load operations readiness checks.");
}

function createEmptyStatusCounts(): Record<OpsCheckStatus, number> {
  return Object.fromEntries(
    opsCheckStatusValues.map((status) => [status, 0])
  ) as Record<OpsCheckStatus, number>;
}

function createEmptyCategoryCounts(): Record<OpsCheckCategory, number> {
  return Object.fromEntries(
    opsCheckCategoryValues.map((category) => [category, 0])
  ) as Record<OpsCheckCategory, number>;
}

function isOpenBlockingCheck(check: OpsReadinessCheck) {
  return (
    check.blocking_launch &&
    check.status !== "passing" &&
    check.status !== "skipped"
  );
}

function mapReadinessInput(
  input: UpdateReadinessCheckInput
): ReadinessUpdate {
  const update: ReadinessUpdate = {};

  if (input.title !== undefined) {
    update.title = input.title.trim();
  }

  if (input.category !== undefined) {
    update.category = validateReadinessCategory(input.category);
  }

  if (input.status !== undefined) {
    update.status = validateReadinessStatus(input.status);
    update.last_checked_at =
      input.lastCheckedAt === undefined
        ? new Date().toISOString()
        : input.lastCheckedAt;
  } else if (input.lastCheckedAt !== undefined) {
    update.last_checked_at = input.lastCheckedAt;
  }

  if (input.description !== undefined) {
    update.description = input.description;
  }

  if (input.owner !== undefined) {
    update.owner = input.owner;
  }

  if (input.evidenceUrl !== undefined) {
    update.evidence_url = input.evidenceUrl;
  }

  if (input.evidenceNote !== undefined) {
    update.evidence_note = input.evidenceNote;
  }

  if (input.dueAt !== undefined) {
    update.due_at = input.dueAt;
  }

  if (input.blockingLaunch !== undefined) {
    update.blocking_launch = input.blockingLaunch;
  }

  if (input.metadata !== undefined) {
    update.metadata = validateSafeMetadata(input.metadata);
  }

  return update;
}

export async function listReadinessChecks(): Promise<OpsReadinessCheck[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_readiness_checks")
    .select("*")
    .order("blocking_launch", { ascending: false })
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throwReadinessError();
  }

  return data ?? [];
}

export async function getReadinessSummary(): Promise<ReadinessSummary> {
  const checks = await listReadinessChecks();
  const byStatus = createEmptyStatusCounts();
  const byCategory = createEmptyCategoryCounts();
  let blockingLaunchCount = 0;
  let blockingOpenCount = 0;

  for (const check of checks) {
    byStatus[check.status] += 1;
    byCategory[check.category] += 1;

    if (check.blocking_launch) {
      blockingLaunchCount += 1;
    }

    if (isOpenBlockingCheck(check)) {
      blockingOpenCount += 1;
    }
  }

  return {
    blockingLaunchCount,
    blockingOpenCount,
    byCategory,
    byStatus,
    launchBlocked: blockingOpenCount > 0,
    total: checks.length,
  };
}

export async function updateReadinessCheck(
  id: string,
  input: UpdateReadinessCheckInput
): Promise<OpsReadinessCheck> {
  const supabase = await createSupabaseServerClient();
  const update = mapReadinessInput(input);
  const { data, error } = await supabase
    .from("ops_readiness_checks")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update operations readiness check.");
  }

  return data;
}

export async function upsertReadinessCheck(
  key: string,
  input: UpsertReadinessCheckInput
): Promise<OpsReadinessCheck> {
  const supabase = await createSupabaseServerClient();
  const mapped = mapReadinessInput(input);
  const insert: ReadinessInsert = {
    ...mapped,
    category: validateReadinessCategory(input.category),
    key: key.trim(),
    title: input.title.trim(),
  };

  const { data, error } = await supabase
    .from("ops_readiness_checks")
    .upsert(insert, { onConflict: "key" })
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to save operations readiness check.");
  }

  return data;
}

export async function getBlockingLaunchChecks(): Promise<OpsReadinessCheck[]> {
  const checks = await listReadinessChecks();

  return checks.filter(isOpenBlockingCheck);
}
