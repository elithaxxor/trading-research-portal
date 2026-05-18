"use server";

import { revalidatePath } from "next/cache";

import {
  updateDashboardSeenAt,
  updateIdeasSeenAt,
  updateLifecycleSeenAt,
} from "@/lib/activity/user-activity";

export async function markDashboardSeenAction() {
  const timestamp = new Date().toISOString();

  await Promise.all([
    updateDashboardSeenAt(timestamp),
    updateLifecycleSeenAt(timestamp),
  ]);
  revalidatePath("/dashboard");
}

export async function markIdeasSeenAction() {
  await updateIdeasSeenAt();
  revalidatePath("/ideas");
  revalidatePath("/dashboard");
}

export async function markLifecycleSeenAction() {
  await updateLifecycleSeenAt();
  revalidatePath("/dashboard");
}
