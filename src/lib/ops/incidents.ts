import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import type {
  CreateIncidentInput,
  OpsIncident,
  UpdateIncidentInput,
} from "./types";
import {
  validateIncidentSeverity,
  validateSafeMetadata,
} from "./validation";

type IncidentInsert =
  Database["public"]["Tables"]["ops_incidents"]["Insert"];
type IncidentUpdate =
  Database["public"]["Tables"]["ops_incidents"]["Update"];

function normalizeText(value: string | null | undefined, maxLength = 200) {
  const normalized = value?.trim().replace(/\s+/g, " ");

  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeIncidentStatus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, "_");

  return normalized ? normalized.slice(0, 40) : undefined;
}

function mapIncidentUpdate(input: UpdateIncidentInput): IncidentUpdate {
  const update: IncidentUpdate = {};

  if (input.title !== undefined) {
    const title = normalizeText(input.title);

    if (!title) {
      throw new Error("Incident title is required.");
    }

    update.title = title;
  }

  if (input.status !== undefined) {
    update.status = normalizeIncidentStatus(input.status);
  }

  if (input.severity !== undefined) {
    update.severity = validateIncidentSeverity(input.severity);
  }

  if (input.summary !== undefined) {
    update.summary = input.summary;
  }

  if (input.affectedArea !== undefined) {
    update.affected_area = normalizeText(input.affectedArea, 120);
  }

  if (input.startedAt !== undefined) {
    update.started_at = input.startedAt;
  }

  if (input.resolvedAt !== undefined) {
    update.resolved_at = input.resolvedAt;
  }

  if (input.resolutionNote !== undefined) {
    update.resolution_note = input.resolutionNote;
  }

  if (input.metadata !== undefined) {
    update.metadata = validateSafeMetadata(input.metadata);
  }

  return update;
}

export async function listIncidents(): Promise<OpsIncident[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_incidents")
    .select("*")
    .order("resolved_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load operations incidents.");
  }

  return data ?? [];
}

export async function createIncident(
  input: CreateIncidentInput
): Promise<OpsIncident> {
  const supabase = await createSupabaseServerClient();
  const userResult = await supabase.auth.getUser();
  const title = normalizeText(input.title);

  if (!title) {
    throw new Error("Incident title is required.");
  }

  const insert: IncidentInsert = {
    affected_area: normalizeText(input.affectedArea, 120),
    created_by: userResult.data.user?.id ?? null,
    metadata: validateSafeMetadata(input.metadata),
    severity: validateIncidentSeverity(input.severity),
    started_at: input.startedAt,
    status: normalizeIncidentStatus(input.status) ?? "open",
    summary: input.summary ?? null,
    title,
  };

  const { data, error } = await supabase
    .from("ops_incidents")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to create operations incident.");
  }

  return data;
}

export async function updateIncident(
  id: string,
  input: UpdateIncidentInput
): Promise<OpsIncident> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_incidents")
    .update(mapIncidentUpdate(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update operations incident.");
  }

  return data;
}

export async function resolveIncident(
  id: string,
  resolutionNote: string
): Promise<OpsIncident> {
  return updateIncident(id, {
    resolutionNote,
    resolvedAt: new Date().toISOString(),
    status: "resolved",
  });
}
