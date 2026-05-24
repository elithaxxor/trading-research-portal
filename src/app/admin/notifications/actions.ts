"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import {
  buildWeeklyDigestForUser,
  getDigestEligibleUsers,
  queueWeeklyDigestRun,
} from "@/lib/email/digest";
import {
  cancelQueuedEmailNotification,
  retryEmailNotification,
} from "@/lib/email/queue";
import { isFeatureEnabled } from "@/lib/flags/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredNotificationId(formData: FormData) {
  const notificationId = getString(formData, "notification_id");

  if (!notificationId) {
    throw new Error("Notification id is required.");
  }

  return notificationId;
}

function parseLimit(formData: FormData) {
  const value = Number(getString(formData, "limit"));

  return Number.isFinite(value) && value > 0
    ? Math.max(1, Math.min(100, Math.floor(value)))
    : undefined;
}

function getDefaultDigestWindow() {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(until.getUTCDate() - 7);

  return { since, until };
}

function parseDateField(formData: FormData, key: string, fallback: Date) {
  const value = getString(formData, key);

  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid digest date window.");
  }

  return date;
}

function getDigestWindow(formData: FormData) {
  const defaults = getDefaultDigestWindow();

  return {
    since: parseDateField(formData, "since", defaults.since),
    until: parseDateField(formData, "until", defaults.until),
  };
}

function buildDigestRedirect(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  return `/admin/notifications/digests?${searchParams.toString()}`;
}

export async function retryEmailNotificationAction(formData: FormData) {
  await requireAdmin("/admin/notifications");

  const notificationId = getRequiredNotificationId(formData);
  await retryEmailNotification(notificationId);
  revalidatePath("/admin/notifications");
  revalidatePath(`/admin/notifications/${notificationId}`);
  redirect(`/admin/notifications/${notificationId}?notice=retried`);
}

export async function cancelEmailNotificationAction(formData: FormData) {
  await requireAdmin("/admin/notifications");

  const notificationId = getRequiredNotificationId(formData);
  await cancelQueuedEmailNotification(notificationId);
  revalidatePath("/admin/notifications");
  revalidatePath(`/admin/notifications/${notificationId}`);
  redirect(`/admin/notifications/${notificationId}?notice=canceled`);
}

export async function triggerWeeklyDigestDryRunAction(formData: FormData) {
  await requireAdmin("/admin/notifications/digests");

  const { since, until } = getDigestWindow(formData);
  const limit = parseLimit(formData);
  const eligibleUsers = await getDigestEligibleUsers();
  const users = limit ? eligibleUsers.slice(0, limit) : eligibleUsers;
  let failed = 0;
  let skipped = eligibleUsers.length - users.length;
  let withItems = 0;

  for (const user of users) {
    try {
      const digest = await buildWeeklyDigestForUser(
        user.userId,
        since,
        until
      );

      if (digest?.hasItems) {
        withItems += 1;
      } else {
        skipped += 1;
      }
    } catch {
      failed += 1;
    }
  }

  redirect(
    buildDigestRedirect({
      failed,
      notice: "dry_run",
      skipped,
      total: eligibleUsers.length,
      withItems,
    })
  );
}

export async function triggerWeeklyDigestQueueAction(formData: FormData) {
  await requireAdmin("/admin/notifications/digests");

  if (!isFeatureEnabled("weekly_digest_enabled")) {
    redirect(buildDigestRedirect({ notice: "digest_disabled" }));
  }

  if (getString(formData, "confirm_digest_queue") !== "yes") {
    redirect(buildDigestRedirect({ notice: "missing_confirmation" }));
  }

  const { since, until } = getDigestWindow(formData);
  const limit = parseLimit(formData);
  let target = buildDigestRedirect({ notice: "queue_failed" });

  try {
    const result = await queueWeeklyDigestRun({ limit, since, until });

    revalidatePath("/admin/notifications");
    revalidatePath("/admin/notifications/digests");
    target = buildDigestRedirect({
      failed: result.failed,
      notice: "queued",
      queued: result.queued,
      skipped: result.skipped,
      total: result.totalEligible,
    });
  } catch {
    target = buildDigestRedirect({ notice: "queue_failed" });
  }

  redirect(target);
}
