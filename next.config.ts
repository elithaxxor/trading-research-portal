import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

const sentryRuntimeEnabled =
  isEnabled(process.env.SENTRY_ENABLED) &&
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());

const sentrySourceMapsEnabled =
  sentryRuntimeEnabled &&
  Boolean(process.env.SENTRY_AUTH_TOKEN?.trim()) &&
  Boolean(process.env.SENTRY_ORG?.trim()) &&
  Boolean(process.env.SENTRY_PROJECT?.trim());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SENTRY_ENABLED: sentryRuntimeEnabled ? "true" : "false",
  },
};

export default sentryRuntimeEnabled
  ? withSentryConfig(nextConfig, {
      authToken: sentrySourceMapsEnabled
        ? process.env.SENTRY_AUTH_TOKEN
        : undefined,
      disableLogger: true,
      org: sentrySourceMapsEnabled ? process.env.SENTRY_ORG : undefined,
      project: sentrySourceMapsEnabled
        ? process.env.SENTRY_PROJECT
        : undefined,
      silent: true,
      sourcemaps: {
        disable: !sentrySourceMapsEnabled,
      },
      telemetry: false,
      widenClientFileUpload: false,
    })
  : nextConfig;
