import type {
  EmailUnsubscribeGroup,
  NotificationCategory,
} from "./types";

export function formatEmailDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function formatNotificationCategory(
  category: NotificationCategory | null | undefined
) {
  if (!category) {
    return "Notification";
  }

  return category
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatUnsubscribeGroup(
  group: EmailUnsubscribeGroup | null | undefined
) {
  if (!group) {
    return "Email notifications";
  }

  const labels: Record<EmailUnsubscribeGroup, string> = {
    all: "All email",
    billing_account: "Billing and account",
    content_updates: "Content updates",
    lifecycle_updates: "Lifecycle updates",
    software_updates: "Software updates",
    weekly_digest: "Weekly digest",
  };

  return labels[group];
}
