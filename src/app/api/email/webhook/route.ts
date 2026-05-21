import { timingSafeEqual } from "node:crypto";

import { Webhook } from "svix";

import {
  getEmailProviderName,
  requirePostmarkWebhookCredentials,
  requireResendWebhookSecret,
} from "@/lib/email/config";
import type { EmailNotificationUpdate } from "@/lib/email/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RawEmailProviderEvent = {
  created_at?: string;
  data?: Record<string, unknown>;
  id?: string;
  type?: string;
} & Record<string, unknown>;

type NormalizedEmailProviderEvent = {
  eventType: string;
  failureMessage: string;
  occurredAt: string;
  payload: RawEmailProviderEvent;
  provider: "postmark" | "resend";
  providerEventId: string | null;
  providerMessageId: string | null;
  recipientEmail: string | null;
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

function getResendHeaderObject(request: Request) {
  return {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
  };
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNestedStringValue(
  data: Record<string, unknown> | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const value = getStringValue(data?.[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function getResendRecipientEmail(data: Record<string, unknown> | undefined) {
  const to = data?.to;

  if (Array.isArray(to)) {
    return getStringValue(to[0]);
  }

  return getNestedStringValue(data, ["email", "recipient", "to"]);
}

function getResendProviderMessageId(
  data: Record<string, unknown> | undefined
) {
  return getNestedStringValue(data, ["email_id", "id", "message_id"]);
}

function getPostmarkProviderMessageId(event: RawEmailProviderEvent) {
  return getNestedStringValue(event, ["MessageID", "MessageId", "message_id"]);
}

function getPostmarkRecipientEmail(event: RawEmailProviderEvent) {
  return getNestedStringValue(event, [
    "Recipient",
    "Email",
    "email",
    "To",
    "to",
  ]);
}

function getFailureMessage(data: Record<string, unknown> | undefined) {
  return (
    getNestedStringValue(data, ["reason", "message", "error", "Description"]) ??
    "Provider email event reported a failure."
  );
}

function getResendEventTimestamp(event: RawEmailProviderEvent) {
  const value = event.created_at ? new Date(event.created_at) : new Date();

  return Number.isNaN(value.getTime())
    ? new Date().toISOString()
    : value.toISOString();
}

function getPostmarkEventTimestamp(event: RawEmailProviderEvent) {
  const value =
    getNestedStringValue(event, [
      "DeliveredAt",
      "BouncedAt",
      "ReceivedAt",
      "OpenedAt",
      "ClickedAt",
      "ChangedAt",
      "Date",
    ]) ?? null;
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function mapPostmarkEventType(event: RawEmailProviderEvent) {
  const recordType = getStringValue(event.RecordType)?.toLowerCase();

  if (recordType === "delivery") {
    return "email.delivered";
  }

  if (recordType === "bounce") {
    return "email.bounced";
  }

  if (recordType === "spamcomplaint") {
    return "email.complained";
  }

  if (recordType === "open") {
    return "email.opened";
  }

  if (recordType === "click") {
    return "email.clicked";
  }

  if (recordType === "smtpapierror") {
    return "email.failed";
  }

  return recordType ? `postmark.${recordType}` : "postmark.unknown";
}

function createPostmarkProviderEventId(event: RawEmailProviderEvent) {
  const explicitId = getNestedStringValue(event, [
    "ID",
    "Id",
    "EventID",
    "EventId",
    "MessageID",
    "MessageId",
  ]);

  if (!explicitId) {
    return null;
  }

  return [
    "postmark",
    explicitId,
    getStringValue(event.RecordType) ?? "unknown",
    getPostmarkEventTimestamp(event),
    getPostmarkRecipientEmail(event) ?? "unknown",
  ].join(":");
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
  event: NormalizedEmailProviderEvent
) {
  const update: EmailNotificationUpdate = {
    metadata: mergeMetadata(
      notification.metadata,
      event.eventType,
      event.occurredAt,
      event.providerEventId
    ),
  };

  if (event.eventType === "email.sent") {
    update.status = "sent";
    update.sent_at = event.occurredAt;
  }

  if (event.eventType === "email.delivered") {
    update.status = "delivered";
    update.delivered_at = event.occurredAt;
  }

  if (event.eventType === "email.bounced") {
    update.status = "bounced";
    update.bounced_at = event.occurredAt;
  }

  if (event.eventType === "email.complained") {
    update.status = "complained";
    update.complained_at = event.occurredAt;
  }

  if (event.eventType === "email.failed") {
    update.status = "failed";
    update.failed_at = event.occurredAt;
    update.last_error = event.failureMessage.slice(0, 2000);
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
}: {
  event: NormalizedEmailProviderEvent;
  notification: EmailNotificationRow | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("email_provider_events").insert({
    email_notification_id: notification?.id ?? null,
    event_type: event.eventType,
    payload: event.payload as Json,
    provider: event.provider,
    provider_event_id: event.providerEventId,
    provider_message_id: event.providerMessageId,
    recipient_email: event.recipientEmail?.trim().toLowerCase() ?? null,
  });

  if (error) {
    throw new Error("Unable to store provider email event.");
  }
}

async function updateLinkedNotification(
  notification: EmailNotificationRow | null,
  event: NormalizedEmailProviderEvent
) {
  if (!notification || !HANDLED_EVENTS.has(event.eventType)) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const update = buildNotificationUpdate(notification, event);
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
  const event = webhook.verify(
    rawBody,
    getResendHeaderObject(request)
  ) as RawEmailProviderEvent;
  const eventType = event.type ?? "unknown";
  const providerEventId = event.id || request.headers.get("svix-id") || null;

  return {
    eventType,
    failureMessage: getFailureMessage(event.data),
    occurredAt: getResendEventTimestamp(event),
    payload: event,
    provider: "resend",
    providerEventId,
    providerMessageId: getResendProviderMessageId(event.data),
    recipientEmail: getResendRecipientEmail(event.data),
  } satisfies NormalizedEmailProviderEvent;
}

function safeCompare(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

function verifyPostmarkBasicAuth(request: Request) {
  const { password, username } = requirePostmarkWebhookCredentials();
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("basic ")) {
    throw new Error("Missing Postmark webhook authorization.");
  }

  const decoded = Buffer.from(authorization.slice(6), "base64").toString(
    "utf8"
  );
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) {
    throw new Error("Invalid Postmark webhook authorization.");
  }

  const suppliedUsername = decoded.slice(0, separatorIndex);
  const suppliedPassword = decoded.slice(separatorIndex + 1);

  if (
    !safeCompare(suppliedUsername, username) ||
    !safeCompare(suppliedPassword, password)
  ) {
    throw new Error("Invalid Postmark webhook authorization.");
  }
}

function verifyPostmarkWebhook(request: Request, rawBody: string) {
  verifyPostmarkBasicAuth(request);

  const event = JSON.parse(rawBody) as RawEmailProviderEvent;
  const eventType = mapPostmarkEventType(event);

  return {
    eventType,
    failureMessage:
      getNestedStringValue(event, ["Description", "Details", "Message"]) ??
      "Postmark email event reported a failure.",
    occurredAt: getPostmarkEventTimestamp(event),
    payload: event,
    provider: "postmark",
    providerEventId: createPostmarkProviderEventId(event),
    providerMessageId: getPostmarkProviderMessageId(event),
    recipientEmail: getPostmarkRecipientEmail(event),
  } satisfies NormalizedEmailProviderEvent;
}

async function verifyProviderWebhook(request: Request, rawBody: string) {
  const provider = getEmailProviderName();

  if (provider === "resend") {
    return verifyResendWebhook(request, rawBody);
  }

  if (provider === "postmark") {
    return verifyPostmarkWebhook(request, rawBody);
  }

  throw new Error(`Unsupported email provider "${provider}".`);
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
  let event: NormalizedEmailProviderEvent;

  try {
    event = await verifyProviderWebhook(request, rawBody);
  } catch {
    return jsonResponse({ error: "Invalid email provider webhook." }, 400);
  }

  try {
    if (await hasStoredProviderEvent(event.providerEventId)) {
      return jsonResponse({ duplicate: true, received: true });
    }

    const notification = await findNotificationByProviderMessageId(
      event.providerMessageId
    );

    await storeProviderEvent({ event, notification });
    await updateLinkedNotification(notification, event);

    return jsonResponse({
      linked: Boolean(notification),
      received: true,
      type: event.eventType,
    });
  } catch (error) {
    console.error("Email provider webhook processing failed.", {
      error:
        error instanceof Error
          ? error.message
          : "Unknown email provider webhook error",
      provider: event.provider,
      providerEventId: event.providerEventId ?? "missing",
      type: event.eventType,
    });

    return jsonResponse({ error: "Email provider webhook failed." }, 500);
  }
}
