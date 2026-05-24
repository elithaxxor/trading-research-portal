import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import type {
  ListOpsEventsParams,
  OpsEvent,
  OpsEventCount,
  RecordOpsEventInput,
} from "./types";
import { analyticsEventSourceValues, productAnalyticsEventNames } from "./types";
import { stripSecretsFromMetadata } from "./safety";
import {
  validateOpsEventName,
  validateSafeMetadata,
} from "./validation";

type OpsEventInsert =
  Database["public"]["Tables"]["ops_events"]["Insert"];

function clampLimit(limit: number | undefined, fallback = 50) {
  if (!limit || !Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(250, Math.floor(limit)));
}

function normalizeSearch(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized.slice(0, 160) : undefined;
}

function normalizeSource(value: unknown) {
  if (
    typeof value === "string" &&
    analyticsEventSourceValues.includes(
      value as (typeof analyticsEventSourceValues)[number]
    )
  ) {
    return value as (typeof analyticsEventSourceValues)[number];
  }

  return "server";
}

export function createSafeOpsMetadata(input: unknown) {
  return validateSafeMetadata(stripSecretsFromMetadata(input));
}

export function isProductAnalyticsEventName(value: string) {
  return productAnalyticsEventNames.includes(
    value as (typeof productAnalyticsEventNames)[number]
  );
}

export async function recordOpsEvent(
  input: RecordOpsEventInput
): Promise<OpsEvent> {
  const supabase = createSupabaseAdminClient();
  const insert: OpsEventInsert = {
    entity_id: input.entityId ?? null,
    entity_type: normalizeSearch(input.entityType) ?? null,
    event_name: validateOpsEventName(input.eventName),
    metadata: createSafeOpsMetadata(input.metadata),
    route: normalizeSearch(input.route) ?? null,
    session_id: normalizeSearch(input.sessionId) ?? null,
    source: normalizeSource(input.source),
    user_id: input.userId ?? null,
  };

  const { data, error } = await supabase
    .from("ops_events")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to record operations event.");
  }

  return data;
}

export async function recordOpsEventSafely(
  input: RecordOpsEventInput
): Promise<void> {
  try {
    await recordOpsEvent(input);
  } catch (error) {
    console.error("[ops] Failed to record operations event.", {
      eventName: input.eventName,
      message:
        error instanceof Error
          ? error.message
          : "Unknown operations event recording error.",
    });
  }
}

export async function listOpsEvents(
  params: ListOpsEventsParams = {}
): Promise<OpsEvent[]> {
  const supabase = await createSupabaseServerClient();
  const limit = clampLimit(params.limit);
  const offset = Math.max(0, params.offset ?? 0);
  let query = supabase.from("ops_events").select("*");

  if (params.eventName) {
    query = query.eq("event_name", validateOpsEventName(params.eventName));
  }

  if (params.source) {
    query = query.eq("source", params.source);
  }

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  }

  if (params.entityType) {
    query = query.eq("entity_type", params.entityType);
  }

  if (params.entityId) {
    query = query.eq("entity_id", params.entityId);
  }

  if (params.route) {
    query = query.ilike("route", `%${params.route.trim().slice(0, 160)}%`);
  }

  if (params.since) {
    query = query.gte("created_at", params.since);
  }

  if (params.until) {
    query = query.lt("created_at", params.until);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error("Unable to load operations events.");
  }

  return data ?? [];
}

export async function getOpsEventCounts(
  params: Omit<ListOpsEventsParams, "limit" | "offset"> = {}
): Promise<OpsEventCount[]> {
  const events = await listOpsEvents({ ...params, limit: 1000 });
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([eventName, count]) => ({ count, eventName }))
    .sort((a, b) => b.count - a.count || a.eventName.localeCompare(b.eventName));
}
