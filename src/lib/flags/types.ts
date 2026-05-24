export const featureFlagKeys = [
  "checkout_enabled",
  "customer_portal_enabled",
  "production_email_sending_enabled",
  "weekly_digest_enabled",
  "admin_content_email_notify_enabled",
  "software_access_requests_enabled",
  "posthog_enabled",
  "sentry_enabled",
  "maintenance_banner_enabled",
] as const;

export type FeatureFlagKey = (typeof featureFlagKeys)[number];

export type FeatureFlagDefinition = {
  defaultEnabled: boolean;
  description: string;
  envVar: string;
  fallbackEnvVars?: string[];
  key: FeatureFlagKey;
  label: string;
  safetyNote: string;
};

export type FeatureFlagState = FeatureFlagDefinition & {
  enabled: boolean;
  rawValue: "set" | "unset";
  source: "env" | "default";
  sourceEnvVar: string;
};
