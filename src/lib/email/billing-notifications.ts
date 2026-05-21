import "server-only";

import {
  formatSubscriptionAccessState,
  formatSubscriptionStatus,
  formatSubscriptionTier,
} from "@/lib/billing/format";
import {
  getEffectiveSubscriptionTier,
  isPaidTier,
  isSubscriptionAccessActive,
} from "@/lib/billing/tiers";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/billing/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { isEmailSuppressed } from "./eligibility";
import { isEmailGroupEnabled } from "./preferences";
import { queueEmailNotification } from "./queue";
import { buildProtectedAppLink } from "./safety";
import { renderBillingAccessStatusEmail } from "./templates/billing-access-status";

type BillingAccessChangeInput = {
  newStatus: SubscriptionStatus;
  newTier: SubscriptionTier;
  previousStatus?: SubscriptionStatus | null;
  previousTier?: SubscriptionTier | null;
  sourceEventId?: string | null;
  userId: string;
};

export type QueueBillingAccessStatusResult = {
  failed: number;
  queued: number;
  skippedReason?: string;
};

function skipped(skippedReason: string): QueueBillingAccessStatusResult {
  return {
    failed: 0,
    queued: 0,
    skippedReason,
  };
}

function getAccessState(tier: SubscriptionTier | null, status: SubscriptionStatus | null) {
  const effectiveTier = getEffectiveSubscriptionTier(tier, status);
  const active = isSubscriptionAccessActive(status);

  return {
    active,
    effectiveTier,
    paid: active && isPaidTier(effectiveTier),
    status: status ?? "none",
    tier: tier ?? "free",
  };
}

function shouldQueueBillingAccessEmail(input: BillingAccessChangeInput) {
  if (!input.sourceEventId) {
    return false;
  }

  const previous = getAccessState(
    input.previousTier ?? "free",
    input.previousStatus ?? "none"
  );
  const next = getAccessState(input.newTier, input.newStatus);

  if (
    previous.effectiveTier !== next.effectiveTier ||
    previous.paid !== next.paid
  ) {
    return true;
  }

  if (
    input.newStatus === "canceled" ||
    input.newStatus === "past_due" ||
    input.newStatus === "unpaid"
  ) {
    return input.previousStatus !== input.newStatus;
  }

  return false;
}

function getAccessSummary(input: BillingAccessChangeInput) {
  const nextEffectiveTier = getEffectiveSubscriptionTier(
    input.newTier,
    input.newStatus
  );
  const nextStatus = formatSubscriptionStatus(input.newStatus);
  const nextTier = formatSubscriptionTier(nextEffectiveTier);

  if (
    isPaidTier(nextEffectiveTier) &&
    isSubscriptionAccessActive(input.newStatus)
  ) {
    return `Your app access is active as ${nextTier}. Premium content and software access now follow this verified subscription state.`;
  }

  if (input.newStatus === "past_due" || input.newStatus === "unpaid") {
    return `Your billing status is ${nextStatus}, so paid content and software access are currently inactive until billing is restored.`;
  }

  if (input.newStatus === "canceled") {
    return "Your subscription is canceled, so paid content and software access are currently inactive.";
  }

  return "Your account is currently on free access. Paid content and software remain locked until a verified active subscription is restored.";
}

async function getUserEmail(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load billing email recipient.");
  }

  return data?.email ?? null;
}

function logBillingNotificationFailure(
  error: unknown,
  context: Record<string, string>
) {
  console.error("Unable to queue billing access status email.", {
    ...context,
    error:
      error instanceof Error
        ? error.message
        : "Unknown billing notification error",
  });
}

export async function queueBillingAccessStatusEmailIfChanged(
  input: BillingAccessChangeInput
): Promise<QueueBillingAccessStatusResult> {
  if (!shouldQueueBillingAccessEmail(input)) {
    return skipped("Subscription access state did not meaningfully change.");
  }

  try {
    const email = await getUserEmail(input.userId);

    if (!email) {
      return skipped("User email is unavailable.");
    }

    if (!(await isEmailGroupEnabled(input.userId, "billing_account"))) {
      return skipped("User disabled billing and account emails.");
    }

    if (await isEmailSuppressed(email)) {
      return skipped("User email is suppressed.");
    }

    const effectiveTier = getEffectiveSubscriptionTier(
      input.newTier,
      input.newStatus
    );
    const accessState = formatSubscriptionAccessState(
      input.newTier,
      input.newStatus
    );
    const rendered = renderBillingAccessStatusEmail({
      accessSummary: `${getAccessSummary(input)} Current access state: ${accessState}.`,
      accountBillingUrl: buildProtectedAppLink("/account/billing"),
      billingStatus: formatSubscriptionStatus(input.newStatus),
      preferenceUrl: buildProtectedAppLink("/account/notifications"),
      tierLabel: formatSubscriptionTier(effectiveTier),
    });

    await queueEmailNotification({
      category: "billing",
      contentId: null,
      contentType: "stripe_webhook_event",
      dedupeKey: `billing-access-status:${input.sourceEventId}:${input.userId}:billing`,
      htmlBody: rendered.html,
      metadata: {
        access_state: accessState,
        new_status: input.newStatus,
        new_tier: input.newTier,
        notification_kind: "billing_access_status",
        previous_status: input.previousStatus ?? null,
        previous_tier: input.previousTier ?? null,
        stripe_event_id: input.sourceEventId,
      },
      previewText: rendered.previewText,
      recipientEmail: email,
      subject: rendered.subject,
      templateKey: "billing-access-status",
      textBody: rendered.text,
      unsubscribeGroup: "billing_account",
      userId: input.userId,
    });

    return {
      failed: 0,
      queued: 1,
    };
  } catch (error) {
    logBillingNotificationFailure(error, {
      sourceEventId: input.sourceEventId ?? "missing",
      userId: input.userId,
    });

    return {
      failed: 1,
      queued: 0,
    };
  }
}
