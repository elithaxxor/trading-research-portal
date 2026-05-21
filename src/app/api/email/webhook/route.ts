import { Webhook } from "svix";

import { requireResendWebhookSecret } from "@/lib/email/config";
import type { EmailNotificationUpdate } from "@/lib/email/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ResendWebhookEvent = {
  created_at?: string;
  data?: Record<string, unknown>;
  id?: string;
  type?: string;
};

type EmailNotificationRow = {
  id: string;
  metadata: Json;
  status: string;
};

type StoredProviderEvent = {
  id: string;
  provider_event_id: string | null;
};

const HANDLED_EVENTS = new Set([
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.complained",
  "email.bounced",
  "email.failed",
  "email.opened",
  "email.clicked",
]);

function jsonResponse(payload: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(payload, { headers, status });
}

function getHeaderObject(request: Request) {
  return {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
  };
}

function getProviderEventId(event: ResendWebhookEvent, request: Request) {
  return event.id || request.headers.get("svix-id") || null;
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getRecipientEmail(data: Record<string, unknown> | undefined) {
  const to = data?.to;

  if (Array.isArray(to)) {
    return getStringValue(to[0]);
  }

  return (
    getStringValue(data?.email) ??
    getStringValue(data?.recipient) ??
    getStringValue(data?.to)
  );
}

function getProviderMessageId(data: Record<string, unknown> | undefined) {
  return (
    getStringValue(data?.email_id) ??
    getStringValue(data?.id) ??
    getStringValue(data?.message_id)
  );
}

function getFailureMessage(data: Record<string, unknown> | undefined) {
  return (
    getStringValue(data?.reason) ??
    getStringValue(data?.message) ??
    getStringValue(data?.error) ??
    "Provider email event reported a failure."
  );
}

function getEventTimestamp(event: ResendWebhookEvent) {
  const value = event.created_at ? new Date(event.created_at) : new Date();

  return Number.isNaN(value.getTime())
    ? new Date().toISOString()
    : value.toISOString();
}

function mergeMetadata(
  metadata: Json,
  eventType: string,
  occurredAt: string,
  providerEventId: string | null
): Json {
  const current =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : {};
  const events =
    "provider_events" in current && typeof current.provider_events === "object"
      ? current.provider_events
      : {};

  return {
    ...current,
    provider_events: {
      ...events,
      [eventType.replace(/\./g, "_")]: {
        occurred_at: occurredAt,
        provider_event_id: providerEventId,
      },
    },
  };
}

function buildNotificationUpdate(
  notification: EmailNotificationRow,
  event: ResendWebhookEvent,
  providerEventId: string | null
) {
  const eventType = event.type ?? "unknown";
  const occurredAt = getEventTimestamp(event);
  const update: EmailNotificationUpdate = {
    metadata: mergeMetadata(
      notification.metadata,
      eventType,
      occurredAt,
      providerEventId
    ),
  };

  if (eventType === "email.sent") {
    update.status = "sent";
    update.sent_at = occurredAt;
  }

  if (eventType === "email.delivered") {
    update.status = "delivered";
    update.delivered_at = occurredAt;
  }

  if (eventType === "email.bounced") {
    update.status = "bounced";
    update.bounced_at = occurredAt;
  }

  if (eventType === "email.complained") {
    update.status = "complained";
    update.complained_at = occurredAt;
  }

  if (eventType === "email.failed") {
    update.status = "failed";
    update.failed_at = occurredAt;
    update.last_error = getFailureMessage(event.data).slice(0, 2000);
  }

  return update;
}

async function findNotificationByProviderMessageId(
  providerMessageId: string | null
) {
  if (!providerMessageId) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_notifications")
    .select("id,metadata,status")
    .eq("provider_message_id", providerMessageId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to link provider event to email notification.");
  }

  return data;
}

async function hasStoredProviderEvent(providerEventId: string | null) {
  if (!providerEventId) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_provider_events")
    .select("id,provider_event_id")
    .eq("provider_event_id", providerEventId)
    .maybeSingle<StoredProviderEvent>();

  if (error) {
    throw new Error("Unable to check provider event idempotency.");
  }

  return Boolean(data);
}

async function storeProviderEvent({
  event,
  notification,
  providerEventId,
  providerMessageId,
  recipientEmail,
}: {
  event: ResendWebhookEvent;
  notification: EmailNotificationRow | null;
  providerEventId: string | null;
  providerMessageId: string | null;
  recipientEmail: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("email_provider_events").insert({
    email_notification_id: notification?.id ?? null,
    event_type: event.type ?? "unknown",
    payload: event as Json,
    provider: "resend",
    provider_event_id: providerEventId,
    provider_message_id: providerMessageId,
    recipient_email: recipientEmail?.trim().toLowerCase() ?? null,
  });

  if (error) {
    throw new Error("Unable to store provider email event.");
  }
}

async function updateLinkedNotification(
  notification: EmailNotificationRow | null,
  event: ResendWebhookEvent,
  providerEventId: string | null
) {
  if (!notification || !event.type || !HANDLED_EVENTS.has(event.type)) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const update = buildNotificationUpdate(notification, event, providerEventId);
  const { error } = await supabase
    .from("email_notifications")
    .update(update)
    .eq("id", notification.id);

  if (error) {
    throw new Error("Unable to update email notification from provider event.");
  }
}

async function verifyResendWebhook(request: Request, rawBody: string) {
  const secret = requireResendWebhookSecret();
  const webhook = new Webhook(secret);

  return webhook.verify(rawBody, getHeaderObject(request)) as ResendWebhookEvent;
}

export function GET() {
  return jsonResponse(
    { error: "Method not allowed." },
    405,
    { Allow: "POST" }
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let event: ResendWebhookEvent;

  try {
    event = await verifyResendWebhook(request, rawBody);
  } catch {
    return jsonResponse({ error: "Invalid email provider webhook." }, 400);
  }

  const providerEventId = getProviderEventId(event, request);

  try {
    if (await hasStoredProviderEvent(providerEventId)) {
      return jsonResponse({ duplicate: true, received: true });
    }

    const providerMessageId = getProviderMessageId(event.data);
    const recipientEmail = getRecipientEmail(event.data);
    const notification =
      await findNotificationByProviderMessageId(providerMessageId);

    await storeProviderEvent({
      event,
      notification,
      providerEventId,
      providerMessageId,
      recipientEmail,
    });
    await updateLinkedNotification(notification, event, providerEventId);

    return jsonResponse({
      linked: Boolean(notification),
      received: true,
      type: event.type ?? "unknown",
    });
  } catch (error) {
    console.error("Email provider webhook processing failed.", {
      error:
        error instanceof Error
          ? error.message
          : "Unknown email provider webhook error",
      providerEventId: providerEventId ?? "missing",
      type: event.type ?? "unknown",
    });

    return jsonResponse({ error: "Email provider webhook failed." }, 500);
  }
}
