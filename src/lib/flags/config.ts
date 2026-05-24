import "server-only";

import type { FeatureFlagDefinition, FeatureFlagKey } from "./types";

export const featureFlagDefinitions: Record<
  FeatureFlagKey,
  FeatureFlagDefinition
> = {
  admin_content_email_notify_enabled: {
    defaultEnabled: true,
    description: "Allows admin content workflows to queue member emails.",
    envVar: "FEATURE_ADMIN_CONTENT_EMAIL_NOTIFY_ENABLED",
    key: "admin_content_email_notify_enabled",
    label: "Admin content email notify",
    safetyNote:
      "Only queues safe previews for eligible members; it never sends directly.",
  },
  checkout_enabled: {
    defaultEnabled: false,
    description: "Allows authenticated users to start Stripe Checkout.",
    envVar: "FEATURE_CHECKOUT_ENABLED",
    key: "checkout_enabled",
    label: "Stripe Checkout",
    safetyNote:
      "Checkout can create billing sessions only; webhooks remain the access source of truth.",
  },
  customer_portal_enabled: {
    defaultEnabled: false,
    description: "Allows users with Stripe customers to open Customer Portal.",
    envVar: "FEATURE_CUSTOMER_PORTAL_ENABLED",
    key: "customer_portal_enabled",
    label: "Stripe Customer Portal",
    safetyNote:
      "Portal access manages Stripe billing only; app tier updates still come from webhooks.",
  },
  maintenance_banner_enabled: {
    defaultEnabled: false,
    description: "Shows a platform maintenance banner when wired into the UI.",
    envVar: "FEATURE_MAINTENANCE_BANNER_ENABLED",
    key: "maintenance_banner_enabled",
    label: "Maintenance banner",
    safetyNote: "Informational only; does not change access or billing.",
  },
  posthog_enabled: {
    defaultEnabled: false,
    description: "Reflects optional PostHog product analytics status.",
    envVar: "POSTHOG_ENABLED",
    fallbackEnvVars: ["FEATURE_POSTHOG_ENABLED"],
    key: "posthog_enabled",
    label: "PostHog analytics",
    safetyNote:
      "Analytics events must stay safe and cannot grant access or alter billing.",
  },
  production_email_sending_enabled: {
    defaultEnabled: false,
    description: "Allows queued email processing to call the active provider.",
    envVar: "FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED",
    key: "production_email_sending_enabled",
    label: "Production email sending",
    safetyNote:
      "Also requires EMAIL_SEND_ENABLED and provider credentials before any send occurs.",
  },
  sentry_enabled: {
    defaultEnabled: false,
    description: "Reflects optional Sentry monitoring status.",
    envVar: "SENTRY_ENABLED",
    fallbackEnvVars: ["FEATURE_SENTRY_ENABLED"],
    key: "sentry_enabled",
    label: "Sentry monitoring",
    safetyNote:
      "Monitoring observes failures only; it does not change app behavior or access.",
  },
  software_access_requests_enabled: {
    defaultEnabled: true,
    description: "Allows members to submit software access requests.",
    envVar: "FEATURE_SOFTWARE_ACCESS_REQUESTS_ENABLED",
    key: "software_access_requests_enabled",
    label: "Software access requests",
    safetyNote:
      "Requests still require server-side entitlement checks and admin review.",
  },
  weekly_digest_enabled: {
    defaultEnabled: false,
    description: "Allows weekly digest queue generation.",
    envVar: "FEATURE_WEEKLY_DIGEST_ENABLED",
    key: "weekly_digest_enabled",
    label: "Weekly digest",
    safetyNote:
      "Digest queueing respects preferences, unsubscribes, suppression, and access eligibility.",
  },
};

export function getFeatureFlagDefinition(key: FeatureFlagKey) {
  return featureFlagDefinitions[key];
}
