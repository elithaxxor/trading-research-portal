import "server-only";

import type { AdminIdea, AdminIdeaUpdateRecord } from "@/lib/admin/types";
import { formatVisibilityLabel } from "@/lib/content/format";
import { isFeatureEnabled } from "@/lib/flags/server";
import {
  formatIdeaOutcome,
  formatIdeaStatus,
  formatLifecycleEventType,
} from "@/lib/lifecycle/format";

import {
  type ContentNotificationPreference,
  getEligibleUsersForContentNotification,
} from "./eligibility";
import { queueEmailNotification } from "./queue";
import { buildProtectedAppLink, createSafePreviewText } from "./safety";
import { renderClosedReviewEmail } from "./templates/closed-review";
import { renderIdeaUpdateEmail } from "./templates/idea-update";
import { renderLifecycleUpdateEmail } from "./templates/lifecycle-update";
import { renderNewIdeaEmail } from "./templates/new-idea";
import type {
  EmailUnsubscribeGroup,
  NotificationCategory,
  NotificationType,
} from "./types";

const NOTIFY_EMAIL_FIELD = "notify_email";

export type QueueContentNotificationResult = {
  eligible: number;
  failed: number;
  queued: number;
  skippedReason?: string;
};

type QueueRecipientsInput = {
  category: NotificationCategory;
  contentId: string;
  contentType: string;
  dedupeScope: string;
  idea: AdminIdea;
  metadata: Record<string, string | number | boolean | null>;
  notificationType: NotificationType;
  preference: ContentNotificationPreference;
  render: () => {
    html: string;
    previewText: string;
    subject: string;
    text: string;
  };
  templateKey: string;
  unsubscribeGroup: EmailUnsubscribeGroup;
};

function emptyResult(skippedReason?: string): QueueContentNotificationResult {
  return {
    eligible: 0,
    failed: 0,
    queued: 0,
    skippedReason,
  };
}

function getIdeaUrl(idea: Pick<AdminIdea, "slug">) {
  return buildProtectedAppLink(`/ideas/${idea.slug}`);
}

function getPreferenceUrl() {
  return buildProtectedAppLink("/account/notifications");
}

function getSafeIdeaPreview(idea: AdminIdea, fallback: string) {
  const source =
    idea.visibility === "free"
      ? idea.public_preview ?? idea.summary ?? fallback
      : idea.public_preview ?? fallback;

  return createSafePreviewText(source);
}

function getSafeUpdateSummary(idea: AdminIdea, updateTitle: string) {
  return createSafePreviewText(
    idea.public_preview ??
      `${updateTitle} is available in the protected portal view for your account.`
  );
}

function getIdeaMetadata(idea: AdminIdea) {
  return {
    idea_id: idea.id,
    idea_slug: idea.slug,
    idea_visibility: idea.visibility,
    source: "admin_content_workflow",
    ticker: idea.ticker,
  };
}

function logQueueFailure(error: unknown, context: Record<string, string>) {
  console.error("Unable to queue content email notification.", {
    ...context,
    error: error instanceof Error ? error.message : "Unknown email queue error",
  });
}

async function queueForEligibleRecipients({
  category,
  contentId,
  contentType,
  dedupeScope,
  idea,
  metadata,
  notificationType,
  preference,
  render,
  templateKey,
  unsubscribeGroup,
}: QueueRecipientsInput): Promise<QueueContentNotificationResult> {
  if (!isFeatureEnabled("admin_content_email_notify_enabled")) {
    return emptyResult("Admin content email notification queueing is disabled.");
  }

  if (!idea.published) {
    return emptyResult("The idea is not published.");
  }

  let recipients;

  try {
    recipients = await getEligibleUsersForContentNotification(
      idea.visibility,
      category,
      preference
    );
  } catch (error) {
    logQueueFailure(error, {
      ideaId: idea.id,
      stage: "load_eligible_recipients",
      templateKey,
    });
    return {
      eligible: 0,
      failed: 1,
      queued: 0,
    };
  }

  const email = render();
  const result: QueueContentNotificationResult = {
    eligible: recipients.length,
    failed: 0,
    queued: 0,
  };

  for (const recipient of recipients) {
    try {
      await queueEmailNotification({
        category,
        contentId,
        contentType,
        dedupeKey: `${templateKey}:${dedupeScope}:${recipient.userId}`,
        htmlBody: email.html,
        metadata,
        notificationType,
        previewText: email.previewText,
        recipientEmail: recipient.email,
        subject: email.subject,
        templateKey,
        textBody: email.text,
        unsubscribeGroup,
        userId: recipient.userId,
      });
      result.queued += 1;
    } catch (error) {
      result.failed += 1;
      logQueueFailure(error, {
        ideaId: idea.id,
        stage: "queue_recipient",
        templateKey,
        userId: recipient.userId,
      });
    }
  }

  return result;
}

export function shouldNotifyEligibleMembers(formData: FormData) {
  return (
    isFeatureEnabled("admin_content_email_notify_enabled") &&
    formData.get(NOTIFY_EMAIL_FIELD) === "on"
  );
}

export function formatQueueResultMessage(
  result: QueueContentNotificationResult
) {
  if (result.skippedReason) {
    return ` Email notification skipped: ${result.skippedReason}`;
  }

  if (result.failed > 0 && result.queued === 0) {
    return " Email notification queueing could not be completed.";
  }

  if (result.failed > 0) {
    return ` Email notifications queued for ${result.queued} member${
      result.queued === 1 ? "" : "s"
    }; ${result.failed} failed.`;
  }

  if (result.eligible === 0) {
    return " No eligible opted-in members were found for email notification.";
  }

  return ` Email notifications queued for ${result.queued} eligible member${
    result.queued === 1 ? "" : "s"
  }.`;
}

export async function queueNewIdeaEmailNotifications(idea: AdminIdea) {
  const safePreview = getSafeIdeaPreview(
    idea,
    "A new research idea is available in the protected portal."
  );

  return queueForEligibleRecipients({
    category: "content",
    contentId: idea.id,
    contentType: "trading_idea",
    dedupeScope: `${idea.id}:new`,
    idea,
    metadata: {
      ...getIdeaMetadata(idea),
      notification_kind: "new_idea",
    },
    notificationType: "new_idea",
    preference: "content_new_ideas",
    render: () =>
      renderNewIdeaEmail({
        ideaUrl: getIdeaUrl(idea),
        preferenceUrl: getPreferenceUrl(),
        safePreview,
        ticker: idea.ticker,
        title: idea.title,
        visibility: formatVisibilityLabel(idea.visibility),
      }),
    templateKey: "new-idea",
    unsubscribeGroup: "content_updates",
  });
}

export async function queueIdeaUpdateEmailNotifications(
  idea: AdminIdea,
  update: AdminIdeaUpdateRecord
) {
  const safeSummary = getSafeUpdateSummary(idea, update.title);

  return queueForEligibleRecipients({
    category: "content",
    contentId: update.id,
    contentType: "idea_update",
    dedupeScope: `${update.id}:idea-update`,
    idea,
    metadata: {
      ...getIdeaMetadata(idea),
      idea_update_id: update.id,
      notification_kind: "idea_update",
    },
    notificationType: "idea_update",
    preference: "content_idea_updates",
    render: () =>
      renderIdeaUpdateEmail({
        ideaTitle: idea.title,
        ideaUrl: getIdeaUrl(idea),
        preferenceUrl: getPreferenceUrl(),
        safeSummary,
        ticker: idea.ticker,
        updateTitle: update.title,
      }),
    templateKey: "idea-update",
    unsubscribeGroup: "content_updates",
  });
}

export async function queueLifecycleUpdateEmailNotifications(
  idea: AdminIdea,
  update: AdminIdeaUpdateRecord
) {
  const eventLabel = formatLifecycleEventType(update.event_type);
  const statusLabel = update.status_after_update
    ? formatIdeaStatus(update.status_after_update)
    : formatIdeaStatus(idea.status);
  const safeSummary = getSafeUpdateSummary(idea, update.title);

  return queueForEligibleRecipients({
    category: "lifecycle",
    contentId: update.id,
    contentType: "idea_update",
    dedupeScope: `${update.id}:lifecycle`,
    idea,
    metadata: {
      ...getIdeaMetadata(idea),
      idea_update_id: update.id,
      lifecycle_event_type: update.event_type,
      notification_kind: "lifecycle_update",
    },
    notificationType: "idea_update",
    preference: "lifecycle_updates",
    render: () =>
      renderLifecycleUpdateEmail({
        eventLabel,
        ideaTitle: idea.title,
        ideaUrl: getIdeaUrl(idea),
        preferenceUrl: getPreferenceUrl(),
        safeSummary,
        statusLabel,
        ticker: idea.ticker,
      }),
    templateKey: "lifecycle-update",
    unsubscribeGroup: "lifecycle_updates",
  });
}

export async function queueClosedReviewEmailNotifications(idea: AdminIdea) {
  if (!idea.review_published) {
    return emptyResult("The closed review is not published.");
  }

  const safeSummary = createSafePreviewText(
    idea.public_preview ??
      "A closed review is available in the protected portal for your account."
  );

  return queueForEligibleRecipients({
    category: "lifecycle",
    contentId: idea.id,
    contentType: "closed_review",
    dedupeScope: `${idea.id}:closed-review`,
    idea,
    metadata: {
      ...getIdeaMetadata(idea),
      notification_kind: "closed_review",
    },
    notificationType: "idea_update",
    preference: "closed_reviews",
    render: () =>
      renderClosedReviewEmail({
        ideaTitle: idea.title,
        outcomeLabel: idea.outcome ? formatIdeaOutcome(idea.outcome) : null,
        preferenceUrl: getPreferenceUrl(),
        reviewUrl: getIdeaUrl(idea),
        safeSummary,
        ticker: idea.ticker,
        userCanAccessOutcome: true,
      }),
    templateKey: "closed-review",
    unsubscribeGroup: "lifecycle_updates",
  });
}
