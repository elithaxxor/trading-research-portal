"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import {
  createIncident,
  resolveIncident,
  updateIncident,
} from "@/lib/ops/incidents";
import { updateReadinessCheck } from "@/lib/ops/readiness";
import type { OpsCheckStatus } from "@/lib/ops/types";
import { opsCheckStatusValues } from "@/lib/ops/types";
import {
  validateIncidentSeverity,
  validateReadinessStatus,
} from "@/lib/ops/validation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredString(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value || null;
}

function getStatusFromForm(formData: FormData) {
  const value = getString(formData, "status");

  return opsCheckStatusValues.includes(value as OpsCheckStatus)
    ? validateReadinessStatus(value)
    : undefined;
}

export async function updateReadinessCheckAction(formData: FormData) {
  await requireAdmin("/admin/ops/readiness");

  const id = getRequiredString(formData, "id");
  await updateReadinessCheck(id, {
    evidenceNote: getOptionalString(formData, "evidence_note"),
    owner: getOptionalString(formData, "owner"),
    status: getStatusFromForm(formData),
  });

  revalidatePath("/admin/ops");
  revalidatePath("/admin/ops/readiness");
  redirect("/admin/ops/readiness?notice=readiness_saved");
}

export async function createIncidentAction(formData: FormData) {
  await requireAdmin("/admin/ops/incidents");

  await createIncident({
    affectedArea: getOptionalString(formData, "affected_area"),
    severity: validateIncidentSeverity(getString(formData, "severity")),
    summary: getOptionalString(formData, "summary"),
    title: getRequiredString(formData, "title"),
  });

  revalidatePath("/admin/ops");
  revalidatePath("/admin/ops/incidents");
  redirect("/admin/ops/incidents?notice=incident_created");
}

export async function updateIncidentAction(formData: FormData) {
  await requireAdmin("/admin/ops/incidents");

  const id = getRequiredString(formData, "id");
  await updateIncident(id, {
    severity: validateIncidentSeverity(getString(formData, "severity")),
    status: getOptionalString(formData, "status") ?? "open",
  });

  revalidatePath("/admin/ops");
  revalidatePath("/admin/ops/incidents");
  redirect("/admin/ops/incidents?notice=incident_saved");
}

export async function resolveIncidentAction(formData: FormData) {
  await requireAdmin("/admin/ops/incidents");

  const id = getRequiredString(formData, "id");
  const resolutionNote =
    getOptionalString(formData, "resolution_note") ?? "Resolved by admin.";

  await resolveIncident(id, resolutionNote);

  revalidatePath("/admin/ops");
  revalidatePath("/admin/ops/incidents");
  redirect("/admin/ops/incidents?notice=incident_resolved");
}
