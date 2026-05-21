import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database.types";

import {
  assertNoPrivateMarkersForUnauthorizedEmail,
  createSafePreviewText,
  stripUnsafeHtml,
} from "./safety";
import type {
  EmailNotification,
  EmailNotificationStatus,
  NotificationCategory,
} from "./types";

type EmailProviderEvent =
  Database["public"]["Tables"]["email_provider_events"]["Row"];
type EmailDigestRun = Database["public"]["Tables"]["email_digest_runs"]["Row"];

export const emailNotificationStatusValues = [
  "queued",
  "sending",
  "sent",
  "delivered",
  "failed",
  "bounced",
  "complained",
  "suppressed",
  "skipped",
  "canceled",
] as const satisfies readonly EmailNotificationStatus[];

export const notificationCategoryValues = [
  "content",
  "lifecycle",
  "digest",
  "software",
  "billing",
  "account",
  "system",
] as const satisfies readonly NotificationCategory[];

export type ListAdminEmailNotificationsFilters = {
  category?: NotificationCategory;
  date?: string;
  limit?: number;
  offset?: number;
  recipient?: string;
  status?: EmailNotificationStatus;
  templateKey?: string;
};

export type ListAdminEmailNotificationsResult = {
  count: number | null;
  items: EmailNotification[];
};

const SENSITIVE_KEY_PARTS = [
  "authorization",
  "credential",
  "password",
  "secret",
  "signature",
  "token",
  "webhook",
];

function clampLimit(limit: number | undefined) {
  if (!limit || !Number.isFinite(limit)) {
    return 25;
  }

  return Math.max(1, Math.min(100, Math.floor(limit)));
}

function normalizeSearch(value: string | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ");

  return normalized ? normalized.slice(0, 160) : undefined;
}

function getUtcDateWindow(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const start = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);

  return {
    end: end.toISOString(),
    start: start.toISOString(),
  };
}

export async function listAdminEmailNotifications(
  filters: ListAdminEmailNotificationsFilters = {}
): Promise<ListAdminEmailNotificationsResult> {
  const supabase = createSupabaseAdminClient();
  const limit = clampLimit(filters.limit);
  const offset = Math.max(0, filters.offset ?? 0);
  let query = supabase
    .from("email_notifications")
    .select("*", { count: "exact" });
  const recipient = normalizeSearch(filters.recipient);
  const templateKey = normalizeSearch(filters.templateKey);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (recipient) {
    query = query.ilike("recipient_email", `%${recipient}%`);
  }

  if (templateKey) {
    query = query.ilike("template_key", `%${templateKey}%`);
  }

  if (filters.date) {
    const window = getUtcDateWindow(filters.date);

    if (window) {
      query = query.gte("queued_at", window.start).lt("queued_at", window.end);
    }
  }

  const { count, data, error } = await query
    .order("queued_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error("Unable to load email notifications.");
  }

  return {
    count,
    items: data ?? [],
  };
}

export async function getAdminEmailNotificationById(notificationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_notifications")
    .select("*")
    .eq("id", notificationId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load email notification.");
  }

  return data;
}

export async function listAdminEmailProviderEvents(
  notificationId: string,
  providerMessageId?: string | null
): Promise<EmailProviderEvent[]> {
  const supabase = createSupabaseAdminClient();
  const byNotification = await supabase
    .from("email_provider_events")
    .select("*")
    .eq("email_notification_id", notificationId)
    .order("received_at", { ascending: false });

  if (byNotification.error) {
    throw new Error("Unable to load email provider events.");
  }

  const events = new Map(
    (byNotification.data ?? []).map((event) => [event.id, event])
  );

  if (providerMessageId) {
    const byMessageId = await supabase
      .from("email_provider_events")
      .select("*")
      .eq("provider_message_id", providerMessageId)
      .order("received_at", { ascending: false });

    if (byMessageId.error) {
      throw new Error("Unable to load email provider events.");
    }

    for (const event of byMessageId.data ?? []) {
      events.set(event.id, event);
    }
  }

  return Array.from(events.values()).sort((a, b) =>
    b.received_at.localeCompare(a.received_at)
  );
}

export async function listAdminEmailDigestRuns(limit = 50) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_digest_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(clampLimit(limit));

  if (error) {
    throw new Error("Unable to load email digest runs.");
  }

  return (data ?? []) as EmailDigestRun[];
}

export function maskEmailAddress(email: string | null | undefined) {
  if (!email) {
    return "Email unavailable";
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "Email unavailable";
  }

  const visibleLocal =
    localPart.length <= 2
      ? `${localPart.at(0) ?? ""}*`
      : `${localPart.slice(0, 2)}***`;
  const [domainName, ...rest] = domain.split(".");
  const visibleDomain =
    domainName.length <= 2
      ? `${domainName.at(0) ?? ""}*`
      : `${domainName.slice(0, 2)}***`;

  return `${visibleLocal}@${[visibleDomain, ...rest].join(".")}`;
}

export function redactSensitiveJson(value: Json | undefined): Json {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveJson(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      const normalizedKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEY_PARTS.some((part) =>
        normalizedKey.includes(part)
      );

      return [
        key,
        isSensitive ? "[redacted]" : redactSensitiveJson(nestedValue),
      ];
    })
  );
}

export function createAdminSafeEmailBodyPreview(
  notification: Pick<EmailNotification, "html_body" | "preview_text" | "text_body">
) {
  const rawBody =
    notification.text_body ??
    notification.preview_text ??
    stripUnsafeHtml(notification.html_body);
  const preview = createSafePreviewText(rawBody, 800);

  try {
    assertNoPrivateMarkersForUnauthorizedEmail(preview);

    return {
      hidden: false,
      preview,
    };
  } catch {
    return {
      hidden: true,
      preview:
        "Body preview hidden because it may contain private fields or unsafe markers.",
    };
  }
}
