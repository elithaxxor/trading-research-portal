"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { queueSoftwareAccessStatusEmailNotification } from "@/lib/email/software-notifications";
import { captureSafeException } from "@/lib/monitoring/sentry";
import { recordOpsEventSafely } from "@/lib/ops/events";
import {
  getAdminSoftwareAccessRequestById,
  updateSoftwareAccessRequestStatus,
} from "@/lib/software/requests";
import type { SoftwareAccessRequestStatus } from "@/lib/software/types";
import { validateSoftwareAccessRequestStatus } from "@/lib/software/validation";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredId(formData: FormData, key: string) {
  const value = getFormValue(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export async function updateSoftwareAccessRequestAction(formData: FormData) {
  await requireAdmin("/admin/software/requests");
  const requestId = getRequiredId(formData, "request_id");
  const status = validateSoftwareAccessRequestStatus(
    getFormValue(formData, "status")
  ) as SoftwareAccessRequestStatus;
  const adminNote = getFormValue(formData, "admin_note");
  const existingRequest = await getAdminSoftwareAccessRequestById(requestId);
  const previousStatus = existingRequest?.status;

  let updatedRequest: Awaited<
    ReturnType<typeof updateSoftwareAccessRequestStatus>
  >;

  try {
    updatedRequest = await updateSoftwareAccessRequestStatus(
      requestId,
      status,
      adminNote
    );

    if (previousStatus !== updatedRequest.status) {
      await queueSoftwareAccessStatusEmailNotification(updatedRequest);
    }
  } catch (error) {
    captureSafeException(error, {
      area: "admin",
      extra: {
        next_status: status,
        previous_status: previousStatus ?? null,
        status_changed: previousStatus !== status,
      },
      route: "/admin/software/requests",
      stage: "admin_software_access_request_update",
    });
    throw error;
  }

  await recordOpsEventSafely({
    entityId: updatedRequest.id,
    entityType: "software_access_request",
    eventName: "admin_software_request_updated",
    metadata: {
      next_status: updatedRequest.status,
      previous_status: previousStatus ?? null,
      status_changed: previousStatus !== updatedRequest.status,
    },
    route: "/admin/software/requests",
    source: "admin",
    userId: updatedRequest.reviewed_by,
  });

  revalidatePath("/admin/software");
  revalidatePath("/admin/software/requests");
  revalidatePath("/dashboard/software");
  redirect("/admin/software/requests?notice=updated");
}
