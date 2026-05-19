"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { updateSoftwareAccessRequestStatus } from "@/lib/software/requests";
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

  await updateSoftwareAccessRequestStatus(requestId, status, adminNote);

  revalidatePath("/admin/software");
  revalidatePath("/admin/software/requests");
  revalidatePath("/dashboard/software");
  redirect("/admin/software/requests?notice=updated");
}
