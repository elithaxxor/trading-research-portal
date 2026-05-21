import type { Database, Json } from "@/types/database.types";

export type EmailProviderName = "resend";

export type NotificationCategory =
  Database["public"]["Enums"]["notification_category"];
export type NotificationChannel =
  Database["public"]["Enums"]["notification_channel"];
export type EmailNotificationStatus =
  Database["public"]["Enums"]["email_notification_status"];
export type EmailUnsubscribeGroup =
  Database["public"]["Enums"]["email_unsubscribe_group"];
export type NotificationType =
  Database["public"]["Enums"]["notification_type"];
export type ContentVisibility =
  Database["public"]["Enums"]["content_visibility"];
export type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];
export type SubscriptionTier = Database["public"]["Enums"]["subscription_tier"];

export type EmailNotification =
  Database["public"]["Tables"]["email_notifications"]["Row"];
export type EmailNotificationInsert =
  Database["public"]["Tables"]["email_notifications"]["Insert"];
export type EmailNotificationUpdate =
  Database["public"]["Tables"]["email_notifications"]["Update"];
export type NotificationPreferences =
  Database["public"]["Tables"]["notification_preferences"]["Row"];
export type NotificationPreferencesInsert =
  Database["public"]["Tables"]["notification_preferences"]["Insert"];
export type NotificationPreferencesUpdate =
  Database["public"]["Tables"]["notification_preferences"]["Update"];
export type TradingIdea = Database["public"]["Tables"]["trading_ideas"]["Row"];
export type SoftwareProduct =
  Database["public"]["Tables"]["software_products"]["Row"];

export type EmailAddress = {
  email: string;
  name?: string | null;
};

export type EmailSendInput = {
  category?: NotificationCategory | null;
  from?: string;
  headers?: Record<string, string>;
  html?: string | null;
  metadata?: Json;
  notificationId?: string;
  previewText?: string | null;
  replyTo?: string | null;
  subject: string;
  tags?: Array<{ name: string; value: string }>;
  text?: string | null;
  to: string | EmailAddress | Array<string | EmailAddress>;
  unsubscribeGroup?: EmailUnsubscribeGroup | null;
};

export type EmailSendResult = {
  id: string | null;
  provider: EmailProviderName | string;
};

export type EmailProvider = {
  providerName: EmailProviderName | string;
  sendEmail(input: EmailSendInput): Promise<EmailSendResult>;
};

export type QueueEmailNotificationInput = {
  category: NotificationCategory;
  contentId?: string | null;
  contentType?: string | null;
  dedupeKey?: string | null;
  htmlBody?: string | null;
  maxRetries?: number;
  metadata?: Json;
  notificationType?: NotificationType;
  previewText?: string | null;
  recipientEmail: string;
  sendAfter?: Date | string | null;
  subject: string;
  templateKey?: string | null;
  textBody?: string | null;
  unsubscribeGroup?: EmailUnsubscribeGroup | null;
  userId?: string | null;
};

export type ProcessQueuedEmailResult = {
  failed: number;
  sent: number;
  skipped: number;
  total: number;
};

export type EligibleEmailRecipient = {
  email: string;
  userId: string;
};

export type UpdateNotificationPreferencesInput = Partial<
  Pick<
    NotificationPreferences,
    | "billing_account_updates"
    | "closed_reviews"
    | "content_idea_updates"
    | "content_new_ideas"
    | "digest_day_of_week"
    | "digest_time_utc"
    | "email_enabled"
    | "lifecycle_updates"
    | "software_access_updates"
    | "weekly_digest"
  >
>;
