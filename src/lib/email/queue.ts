import "server-only";

import { createHash } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getEmailConfig, isEmailSendingEnabled } from "./config";
import { hasUserUnsubscribed, isEmailSuppressed } from "./eligibility";
import { sendEmail } from "./provider";
import {
  assertNoPrivateMarkersForUnauthorizedEmail,
  createSafePreviewText,
  sanitizeEmailHtml,
  stripUnsafeHtml,
} from "./safety";
import {
  addListUnsubscribeHeaders,
  createUnsubscribeToken,
  getUnsubscribeUrl,
} from "./unsubscribe";
import type {
  EmailNotification,
  EmailNotificationUpdate,
  ProcessQueuedEmailResult,
  QueueEmailNotificationInput,
} from "./types";

function clampLimit(limit: number | undefined) {
  if (!limit || !Number.isFinite(limit)) {
    return 25;
  }

  return Math.max(1, Math.min(100, Math.floor(limit)));
}

function normalizeSendAfter(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid email send_after date.");
  }

  return date.toISOString();
}

function getNotificationType(input: QueueEmailNotificationInput) {
  if (input.notificationType) {
    return input.notificationType;
  }

  if (input.category === "digest") {
    return "weekly_digest";
  }

  if (input.category === "content") {
    return "new_idea";
  }

  return "idea_update";
}

function getEmailBody(notification: EmailNotification) {
  const html = notification.html_body
    ? sanitizeEmailHtml(notification.html_body)
    : undefined;
  const text = notification.text_body
    ? stripUnsafeHtml(notification.text_body)
    : notification.preview_text || "";

  return { html, text };
}

export function createDedupeKey(input: QueueEmailNotificationInput) {
  const base = [
    input.userId ?? "anonymous",
    input.recipientEmail.trim().toLowerCase(),
    input.category,
    input.templateKey ?? "",
    input.contentType ?? "",
    input.contentId ?? "",
    input.subject.trim(),
  ].join("|");

  return createHash("sha256").update(base).digest("hex");
}

export async function queueEmailNotification(input: QueueEmailNotificationInput) {
  if (!input.recipientEmail.trim()) {
    throw new Error("Recipient email is required.");
  }

  if (!input.subject.trim()) {
    throw new Error("Email subject is required.");
  }

  const previewText = createSafePreviewText(input.previewText ?? input.textBody);
  const textBody = input.textBody ? stripUnsafeHtml(input.textBody) : previewText;
  const htmlBody = input.htmlBody ? sanitizeEmailHtml(input.htmlBody) : null;

  assertNoPrivateMarkersForUnauthorizedEmail(previewText);
  assertNoPrivateMarkersForUnauthorizedEmail(textBody);

  const supabase = createSupabaseAdminClient();
  const dedupeKey = input.dedupeKey ?? createDedupeKey(input);
  const insert = {
    category: input.category,
    content_id: input.contentId ?? null,
    content_type: input.contentType ?? null,
    dedupe_key: dedupeKey,
    html_body: htmlBody,
    max_retries: input.maxRetries ?? 3,
    metadata: input.metadata ?? {},
    notification_type: getNotificationType(input),
    preview_text: previewText,
    recipient_email: input.recipientEmail.trim().toLowerCase(),
    send_after: normalizeSendAfter(input.sendAfter),
    status: "queued" as const,
    subject: input.subject.trim(),
    template_key: input.templateKey ?? null,
    text_body: textBody,
    unsubscribe_group: input.unsubscribeGroup ?? null,
    user_id: input.userId ?? null,
  };
  const { data, error } = await supabase
    .from("email_notifications")
    .insert(insert)
    .select("*")
    .single();

  if (!error) {
    return data;
  }

  if (error.code === "23505") {
    const { data: existing, error: existingError } = await supabase
      .from("email_notifications")
      .select("*")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (!existingError && existing) {
      return existing;
    }
  }

  throw new Error("Unable to queue email notification.");
}

export async function markEmailNotificationSent(
  notificationId: string,
  providerMessageId: string | null,
  provider: string = getEmailConfig().provider
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_notifications")
    .update({
      provider,
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      status: "sent",
    })
    .eq("id", notificationId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to mark email notification sent.");
  }

  return data;
}

export async function markEmailNotificationFailed(
  notificationId: string,
  errorMessage: string
) {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: selectError } = await supabase
    .from("email_notifications")
    .select("retry_count")
    .eq("id", notificationId)
    .single();

  if (selectError) {
    throw new Error("Unable to load failed email notification.");
  }

  const update: EmailNotificationUpdate = {
    failed_at: new Date().toISOString(),
    last_error: errorMessage.slice(0, 2000),
    retry_count: (existing.retry_count ?? 0) + 1,
    status: "failed",
  };
  const { data, error } = await supabase
    .from("email_notifications")
    .update(update)
    .eq("id", notificationId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to mark email notification failed.");
  }

  return data;
}

async function markEmailNotificationSkipped(
  notificationId: string,
  reason: string,
  status: "skipped" | "suppressed" = "skipped"
) {
  const supabase = createSupabaseAdminClient();
  const update: EmailNotificationUpdate = {
    last_error: reason,
    status,
  };

  if (status === "suppressed") {
    update.suppressed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("email_notifications")
    .update(update)
    .eq("id", notificationId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to mark email notification skipped.");
  }

  return data;
}

export async function retryFailedEmailNotifications() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_notifications")
    .select("id,retry_count,max_retries")
    .eq("status", "failed");

  if (error) {
    throw new Error("Unable to load failed email notifications.");
  }

  const retryableIds = (data ?? [])
    .filter((row) => row.retry_count < row.max_retries)
    .map((row) => row.id);

  if (retryableIds.length === 0) {
    return 0;
  }

  const { error: updateError } = await supabase
    .from("email_notifications")
    .update({
      last_error: null,
      send_after: new Date().toISOString(),
      status: "queued",
    })
    .in("id", retryableIds);

  if (updateError) {
    throw new Error("Unable to retry failed email notifications.");
  }

  return retryableIds.length;
}

export async function retryEmailNotification(notificationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: selectError } = await supabase
    .from("email_notifications")
    .select("id,status")
    .eq("id", notificationId)
    .single();

  if (selectError || !existing) {
    throw new Error("Unable to load email notification.");
  }

  if (existing.status !== "failed" && existing.status !== "queued") {
    throw new Error("Only failed or queued email notifications can be retried.");
  }

  const { data, error } = await supabase
    .from("email_notifications")
    .update({
      failed_at: null,
      last_error: null,
      send_after: new Date().toISOString(),
      status: "queued",
    })
    .eq("id", notificationId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to retry email notification.");
  }

  return data;
}

export async function cancelQueuedEmailNotification(notificationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: selectError } = await supabase
    .from("email_notifications")
    .select("id,status")
    .eq("id", notificationId)
    .single();

  if (selectError || !existing) {
    throw new Error("Unable to load email notification.");
  }

  if (existing.status !== "queued") {
    throw new Error("Only queued email notifications can be canceled.");
  }

  const { data, error } = await supabase
    .from("email_notifications")
    .update({
      last_error: "Canceled by an admin before sending.",
      status: "canceled",
    })
    .eq("id", notificationId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to cancel email notification.");
  }

  return data;
}

export async function processQueuedEmail(limit?: number) {
  const result: ProcessQueuedEmailResult = {
    failed: 0,
    sent: 0,
    skipped: 0,
    total: 0,
  };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_notifications")
    .select("*")
    .eq("status", "queued")
    .or(`send_after.is.null,send_after.lte.${new Date().toISOString()}`)
    .order("queued_at", { ascending: true })
    .limit(clampLimit(limit));

  if (error) {
    throw new Error("Unable to load queued email notifications.");
  }

  for (const notification of data ?? []) {
    result.total += 1;

    if (!isEmailSendingEnabled()) {
      result.skipped += 1;
      continue;
    }

    if (!notification.recipient_email) {
      await markEmailNotificationFailed(
        notification.id,
        "Missing recipient email."
      );
      result.failed += 1;
      continue;
    }

    try {
      await supabase
        .from("email_notifications")
        .update({ status: "sending" })
        .eq("id", notification.id);

      if (await isEmailSuppressed(notification.recipient_email)) {
        await markEmailNotificationSkipped(
          notification.id,
          "Recipient email is suppressed.",
          "suppressed"
        );
        result.skipped += 1;
        continue;
      }

      if (
        notification.unsubscribe_group &&
        (await hasUserUnsubscribed(
          notification.recipient_email,
          notification.unsubscribe_group
        ))
      ) {
        await markEmailNotificationSkipped(
          notification.id,
          "Recipient unsubscribed from this email group."
        );
        result.skipped += 1;
        continue;
      }

      const { html, text } = getEmailBody(notification);
      const unsubscribeToken =
        notification.unsubscribe_group && notification.recipient_email
          ? await createUnsubscribeToken(
              notification.user_id,
              notification.recipient_email,
              notification.unsubscribe_group
            )
          : null;
      const emailInput = addListUnsubscribeHeaders({
        category: notification.category,
        html,
        metadata: notification.metadata,
        notificationId: notification.id,
        previewText: notification.preview_text,
        subject: notification.subject || "Trading Research Portal update",
        text,
        to: notification.recipient_email,
        unsubscribeGroup: notification.unsubscribe_group,
        unsubscribeUrl: unsubscribeToken
          ? getUnsubscribeUrl(unsubscribeToken)
          : null,
      });
      const sendResult = await sendEmail(emailInput);

      await markEmailNotificationSent(
        notification.id,
        sendResult.id,
        sendResult.provider
      );
      result.sent += 1;
    } catch (sendError) {
      await markEmailNotificationFailed(
        notification.id,
        sendError instanceof Error ? sendError.message : "Email send failed."
      );
      result.failed += 1;
    }
  }

  return result;
}
