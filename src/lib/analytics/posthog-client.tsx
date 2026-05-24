"use client";

import {
  type AnalyticsEventName,
  type SafeAnalyticsProperties,
  createSafeAnalyticsProperties,
  isAnalyticsEventName,
} from "./events";

type PostHogInitInput = {
  enabled: boolean;
};

type PostHogClient = typeof import("posthog-js").default;

let hasInitializedPostHog = false;
let postHogEnabled = false;
let postHogClient: PostHogClient | null = null;
let postHogInitPromise: Promise<PostHogClient | null> | null = null;

function getPostHogKey() {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
}

function getPostHogHost() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://app.posthog.com"
  );
}

export function initPostHog({ enabled }: PostHogInitInput) {
  const key = getPostHogKey();

  postHogEnabled = enabled && Boolean(key);

  if (!postHogEnabled || hasInitializedPostHog || postHogInitPromise) {
    return;
  }

  postHogInitPromise = import("posthog-js")
    .then((module) => {
      const posthog = module.default;

      posthog.init(key, {
        api_host: getPostHogHost(),
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        person_profiles: "identified_only",
      });
      hasInitializedPostHog = true;
      postHogClient = posthog;

      return posthog;
    })
    .catch(() => {
      hasInitializedPostHog = false;
      postHogClient = null;
      postHogEnabled = false;
      postHogInitPromise = null;

      return null;
    });
}

export function captureAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties?: SafeAnalyticsProperties
) {
  if (!postHogEnabled || !isAnalyticsEventName(eventName)) {
    return;
  }

  const safeProperties = createSafeAnalyticsProperties(properties);

  void postHogInitPromise?.then((posthog) => {
    if (posthog && hasInitializedPostHog) {
      posthog.capture(eventName, safeProperties);
    }
  });
}

export function isFeatureEnabled(flagKey: string) {
  const safeFlagKey = flagKey.trim();

  if (
    !postHogEnabled ||
    !safeFlagKey ||
    !/^[A-Za-z0-9._:-]{1,96}$/.test(safeFlagKey)
  ) {
    return false;
  }

  return postHogClient?.isFeatureEnabled(safeFlagKey) === true;
}
