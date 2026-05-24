import "server-only";

import type { Json } from "@/types/database.types";

const SENSITIVE_KEY_PARTS = [
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "credential",
  "database_password",
  "database_url",
  "jwt",
  "password",
  "private_key",
  "secret",
  "service_role",
  "signature",
  "token",
  "webhook_password",
];

const PRIVATE_CONTENT_KEY_PARTS = [
  "card_data",
  "entry_zone",
  "invalidation",
  "lessons_learned",
  "member_note",
  "outcome_summary",
  "pine_source",
  "private_chart",
  "private_content",
  "source_code",
  "target_",
  "thesis",
];

const SECRET_VALUE_PATTERNS = [
  /sk_(live|test)_[A-Za-z0-9]+/,
  /sb_secret_[A-Za-z0-9_-]+/,
  /service_role/i,
  /postgres(ql)?:\/\/[^"\s]+/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[-\s]/g, "_");
}

function hasKeyPart(key: string, parts: readonly string[]) {
  const normalized = normalizeKey(key);

  return parts.some((part) => normalized.includes(part));
}

function isSecretLikeString(value: string) {
  return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

function toJsonValue(value: unknown): Json {
  if (value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return typeof value === "string" && isSecretLikeString(value)
      ? "[redacted]"
      : value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }

  if (isRecord(value)) {
    const output: Record<string, Json> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (hasKeyPart(key, SENSITIVE_KEY_PARTS)) {
        continue;
      }

      output[key] = toJsonValue(nestedValue);
    }

    return output;
  }

  return String(value);
}

function assertNoPrivateKeys(value: Json | undefined, path: string[] = []) {
  if (value === undefined || value === null || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoPrivateKeys(item, [...path, String(index)])
    );
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (hasKeyPart(key, PRIVATE_CONTENT_KEY_PARTS)) {
      throw new Error(
        `Ops metadata cannot include private content field "${[
          ...path,
          key,
        ].join(".")}".`
      );
    }

    assertNoPrivateKeys(nestedValue, [...path, key]);
  }
}

export function stripSecretsFromMetadata(input: unknown): Json {
  const value = input === undefined ? {} : input;

  return toJsonValue(value);
}

export function assertNoPrivateContentInOpsMetadata(input: unknown): void {
  const metadata = stripSecretsFromMetadata(input);

  assertNoPrivateKeys(metadata);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) {
    return "";
  }

  const [localPart, domain] = email.split("@");

  if (!domain) {
    return "***";
  }

  const visible = localPart.slice(0, 1);

  return `${visible || "*"}***@${domain}`;
}

export function maskStripeId(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  if (value.length <= 10) {
    return `${value.slice(0, 4)}...`;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function maskSupabaseUserId(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
