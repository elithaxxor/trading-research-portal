import "server-only";

import { getEffectiveSubscriptionTier } from "@/lib/billing/tiers";
import { canAccessSoftwareTier } from "@/lib/software/access";
import { formatSoftwareAccessStatus } from "@/lib/software/format";
import type {
  SoftwareAccessRequest,
  SoftwareAccessRequestStatus,
  SoftwareProduct,
} from "@/lib/software/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { hasUserUnsubscribed, isEmailSuppressed } from "./eligibility";
import { isEmailGroupEnabled } from "./preferences";
import { queueEmailNotification } from "./queue";
import {
  assertNoPrivateMarkersForUnauthorizedEmail,
  buildProtectedAppLink,
  createSafePreviewText,
} from "./safety";
import { renderSoftwareAccessStatusEmail } from "./templates/software-access-status";
import type { SubscriptionStatus, SubscriptionTier } from "./types";

const NOTIFIABLE_SOFTWARE_REQUEST_STATUSES = new Set<SoftwareAccessRequestStatus>(
  ["needs_info", "approved", "granted", "rejected", "revoked"]
);

type RequestOwnerContext = {
  email: string | null;
  role: "admin" | "user";
  status: SubscriptionStatus | null;
  tier: SubscriptionTier | null;
};

export type QueueSoftwareAccessStatusResult = {
  failed: number;
  queued: number;
  skippedReason?: string;
};

function skipped(skippedReason: string): QueueSoftwareAccessStatusResult {
  return {
    failed: 0,
    queued: 0,
    skippedReason,
  };
}

function safeAdminNote(adminNote: string | null) {
  const note = createSafePreviewText(adminNote, 220);

  if (!note) {
    return null;
  }

  try {
    assertNoPrivateMarkersForUnauthorizedEmail(note);
  } catch {
    return null;
  }

  return note;
}

async function getRequestOwnerContext(
  userId: string
): Promise<RequestOwnerContext | null> {
  const supabase = createSupabaseAdminClient();
  const [profileResult, subscriptionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("email,role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (profileResult.error || subscriptionResult.error || !profileResult.data) {
    return null;
  }

  return {
    email: profileResult.data.email,
    role: profileResult.data.role,
    status: subscriptionResult.data?.status ?? null,
    tier: subscriptionResult.data?.tier ?? null,
  };
}

async function getSoftwareProduct(productId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("software_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load software product for notification.");
  }

  return data;
}

function shouldRequireActiveSoftwareAccess(status: SoftwareAccessRequestStatus) {
  return status === "approved" || status === "granted";
}

function canOwnerReceiveStatusDetails({
  owner,
  product,
  status,
}: {
  owner: RequestOwnerContext;
  product: Pick<SoftwareProduct, "access_tier">;
  status: SoftwareAccessRequestStatus;
}) {
  if (!shouldRequireActiveSoftwareAccess(status)) {
    return true;
  }

  const effectiveTier = getEffectiveSubscriptionTier(
    owner.tier,
    owner.status,
    owner.role === "admin"
  );

  return canAccessSoftwareTier(
    product.access_tier,
    effectiveTier,
    owner.role === "admin"
  );
}

function logSoftwareNotificationFailure(
  error: unknown,
  context: Record<string, string>
) {
  console.error("Unable to queue software access status email.", {
    ...context,
    error:
      error instanceof Error
        ? error.message
        : "Unknown software notification error",
  });
}

export async function queueSoftwareAccessStatusEmailNotification(
  request: SoftwareAccessRequest
): Promise<QueueSoftwareAccessStatusResult> {
  if (!NOTIFIABLE_SOFTWARE_REQUEST_STATUSES.has(request.status)) {
    return skipped("Status does not require an email notification.");
  }

  try {
    const [owner, product] = await Promise.all([
      getRequestOwnerContext(request.user_id),
      getSoftwareProduct(request.software_product_id),
    ]);

    if (!owner?.email) {
      return skipped("Request owner email is unavailable.");
    }

    if (!product) {
      return skipped("Software product is unavailable.");
    }

    if (!(await isEmailGroupEnabled(request.user_id, "software_updates"))) {
      return skipped("Request owner disabled software update emails.");
    }

    if (
      (await isEmailSuppressed(owner.email)) ||
      (await hasUserUnsubscribed(owner.email, "software_updates"))
    ) {
      return skipped("Request owner email is suppressed or unsubscribed.");
    }

    if (!canOwnerReceiveStatusDetails({ owner, product, status: request.status })) {
      return skipped("Request owner does not currently have software access.");
    }

    const statusLabel = formatSoftwareAccessStatus(request.status);
    const email = renderSoftwareAccessStatusEmail({
      adminNote: safeAdminNote(request.admin_note),
      preferenceUrl: buildProtectedAppLink("/account/notifications"),
      productTitle: product.title,
      requestUrl: buildProtectedAppLink(`/dashboard/software/${product.slug}`),
      status: statusLabel,
      tradingViewUsername: request.tradingview_username,
    });

    await queueEmailNotification({
      category: "software",
      contentId: request.id,
      contentType: "software_access_request",
      dedupeKey: `software-access-status:${request.id}:${request.status}`,
      htmlBody: email.html,
      metadata: {
        notification_kind: "software_access_status",
        request_id: request.id,
        request_status: request.status,
        software_access_tier: product.access_tier,
        software_product_id: product.id,
        software_slug: product.slug,
      },
      previewText: email.previewText,
      recipientEmail: owner.email,
      subject: email.subject,
      templateKey: "software-access-status",
      textBody: email.text,
      unsubscribeGroup: "software_updates",
      userId: request.user_id,
    });

    return {
      failed: 0,
      queued: 1,
    };
  } catch (error) {
    logSoftwareNotificationFailure(error, {
      requestId: request.id,
      status: request.status,
      userId: request.user_id,
    });

    return {
      failed: 1,
      queued: 0,
    };
  }
}
