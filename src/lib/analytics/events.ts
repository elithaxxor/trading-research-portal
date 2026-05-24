export const analyticsEventNames = [
  "page_view",
  "pricing_viewed",
  "checkout_started",
  "dashboard_section_viewed",
  "software_product_viewed",
  "software_access_requested",
  "notification_preference_updated",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type SafeAnalyticsProperties = Record<
  string,
  boolean | number | string | null | undefined
>;

const sensitiveKeyParts = [
  "api_key",
  "apikey",
  "authorization",
  "card",
  "cookie",
  "email",
  "entry",
  "invalidation",
  "password",
  "pine",
  "secret",
  "source_code",
  "target",
  "thesis",
  "token",
];

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[-\s]/g, "_");
}

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return analyticsEventNames.includes(value as AnalyticsEventName);
}

export function createSafeAnalyticsProperties(
  properties: SafeAnalyticsProperties = {}
): SafeAnalyticsProperties {
  const safeProperties: SafeAnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    const normalizedKey = normalizeKey(key);

    if (sensitiveKeyParts.some((part) => normalizedKey.includes(part))) {
      continue;
    }

    safeProperties[key] =
      typeof value === "string" ? value.slice(0, 160) : value;
  }

  return safeProperties;
}
