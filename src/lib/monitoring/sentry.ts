import * as Sentry from "@sentry/nextjs";
import type { Breadcrumb, Event, SeverityLevel } from "@sentry/nextjs";

type JsonLike =
  | boolean
  | null
  | number
  | string
  | JsonLike[]
  | { [key: string]: JsonLike | undefined };

type SafeCaptureContext = {
  area?: string;
  extra?: Record<string, unknown>;
  level?: SeverityLevel;
  route?: string;
  stage?: string;
  tags?: Record<string, string | boolean | number | null | undefined>;
};

const MAX_SCRUB_DEPTH = 6;
const FILTERED_VALUE = "[Filtered]";

const SENSITIVE_KEY_PATTERN =
  /(api[_-]?key|auth|authorization|body|card|cookie|credential|database|email|entry[_-]?zone|html|invalidation|invoice|jwt|lesson|outcome|password|pine|private|secret|service[_-]?role|signature|source[_-]?code|stripe|supabase|target|text[_-]?body|thesis|token|webhook)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /\bsk_(?:live|test)_[A-Za-z0-9_]+\b/g,
  /\bwhsec_[A-Za-z0-9_]+\b/g,
  /\bsb_secret_[A-Za-z0-9_]+\b/g,
  /\bservice_role\b/gi,
  /\bpostgres(?:ql)?:\/\/[^\s"'<>]+/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

function parseEnabledFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function hasSentryDsn() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

export function isSentryEnabled() {
  return (
    hasSentryDsn() &&
    (parseEnabledFlag(process.env.SENTRY_ENABLED) ||
      parseEnabledFlag(process.env.NEXT_PUBLIC_SENTRY_ENABLED))
  );
}

export function getSentryDsn() {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
}

export function getSentryEnvironment() {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NETLIFY_CONTEXT ??
    process.env.NODE_ENV ??
    "development"
  );
}

export function getSentryTracesSampleRate() {
  return process.env.NODE_ENV === "production" ? 0.05 : 0.2;
}

function redactSensitiveString(value: string) {
  return SENSITIVE_VALUE_PATTERNS.reduce(
    (nextValue, pattern) => nextValue.replace(pattern, FILTERED_VALUE),
    value
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function scrubUnknown(value: unknown, depth = 0): JsonLike | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return redactSensitiveString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_SCRUB_DEPTH) {
      return "[Array]";
    }

    return value
      .slice(0, 50)
      .map((item) => scrubUnknown(item, depth + 1))
      .filter((item): item is JsonLike => item !== undefined);
  }

  if (isPlainObject(value)) {
    if (depth >= MAX_SCRUB_DEPTH) {
      return "[Object]";
    }

    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 80)
        .map(([key, item]) => [
          key,
          SENSITIVE_KEY_PATTERN.test(key)
            ? FILTERED_VALUE
            : scrubUnknown(item, depth + 1),
        ])
        .filter(([, item]) => item !== undefined)
    ) as JsonLike;
  }

  if (value instanceof Error) {
    return {
      message: redactSensitiveString(value.message),
      name: value.name,
    };
  }

  return undefined;
}

export function scrubSentryEvent<TEvent extends Event>(event: TEvent): TEvent {
  const scrubbed = scrubUnknown(event);

  if (!scrubbed || typeof scrubbed !== "object" || Array.isArray(scrubbed)) {
    return event;
  }

  return scrubbed as unknown as TEvent;
}

export function scrubSentryBreadcrumb(breadcrumb: Breadcrumb) {
  const scrubbed = scrubUnknown(breadcrumb);

  if (!scrubbed || typeof scrubbed !== "object" || Array.isArray(scrubbed)) {
    return breadcrumb;
  }

  return scrubbed as Breadcrumb;
}

export function createSafeSentryExtra(input: Record<string, unknown>) {
  return scrubUnknown(input) as Record<string, JsonLike>;
}

export function captureSafeException(
  error: unknown,
  context: SafeCaptureContext = {}
) {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context.level) {
      scope.setLevel(context.level);
    }

    if (context.area) {
      scope.setTag("area", context.area);
    }

    if (context.route) {
      scope.setTag("route", context.route);
    }

    if (context.stage) {
      scope.setTag("stage", context.stage);
    }

    for (const [key, value] of Object.entries(context.tags ?? {})) {
      if (value !== null && value !== undefined) {
        scope.setTag(key, value);
      }
    }

    if (context.extra) {
      scope.setExtra("safe_context", createSafeSentryExtra(context.extra));
    }

    Sentry.captureException(error);
  });
}
