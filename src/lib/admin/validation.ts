import type { Database } from "@/types/database.types";

type ContentVisibility = Database["public"]["Enums"]["content_visibility"];
type IdeaStatus = Database["public"]["Enums"]["idea_status"];
type IdeaBias = Database["public"]["Enums"]["idea_bias"];
type AssetClass = Database["public"]["Enums"]["asset_class"];
type RiskLevel = Database["public"]["Enums"]["risk_level"];
type ChartType = Database["public"]["Enums"]["chart_type"];

type ValidationResult<TValue> =
  | {
      error: string;
      ok: false;
    }
  | {
      ok: true;
      value: TValue;
    };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const tickerPattern = /^[A-Z0-9.-]+$/;
const sensitivePreviewPattern =
  /\b(exact\s+entry|entry(?:\s+zone)?|entries|target(?:s)?|invalidation|stop(?:\s+loss)?|full\s+thesis|proprietary\s+setup)\b/i;

export const contentVisibilityValues = [
  "free",
  "premium",
  "pro",
] as const satisfies readonly ContentVisibility[];

export const ideaStatusValues = [
  "watching",
  "active",
  "triggered",
  "invalidated",
  "target_hit",
  "closed",
] as const satisfies readonly IdeaStatus[];

export const ideaBiasValues = [
  "long",
  "short",
  "neutral",
  "watch",
] as const satisfies readonly IdeaBias[];

export const assetClassValues = [
  "stock",
  "etf",
  "option",
  "crypto",
  "forex",
  "futures",
  "index",
  "macro",
  "other",
] as const satisfies readonly AssetClass[];

export const riskLevelValues = [
  "low",
  "medium",
  "high",
] as const satisfies readonly RiskLevel[];

export const chartTypeValues = [
  "tradingview_embed",
  "image",
  "lightweight_chart",
] as const satisfies readonly ChartType[];

function valid<TValue>(value: TValue): ValidationResult<TValue> {
  return {
    ok: true,
    value,
  };
}

function invalid<TValue = never>(error: string): ValidationResult<TValue> {
  return {
    error,
    ok: false,
  };
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateEnumValue<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  label: string
): ValidationResult<TValue> {
  const normalized = getStringValue(value);

  if (!normalized) {
    return invalid(`${label} is required.`);
  }

  if (!allowedValues.includes(normalized as TValue)) {
    return invalid(`Choose a valid ${label.toLowerCase()}.`);
  }

  return valid(normalized as TValue);
}

export function normalizeEmptyString(value: unknown) {
  const normalized = getStringValue(value);

  return normalized ? normalized : null;
}

export function generateSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

export function validateSlug(slug: unknown): ValidationResult<string> {
  const normalized = generateSlug(getStringValue(slug));

  if (!normalized) {
    return invalid("Slug is required.");
  }

  if (normalized.length > 100) {
    return invalid("Slug must be 100 characters or fewer.");
  }

  if (!slugPattern.test(normalized)) {
    return invalid(
      "Slug must use lowercase letters, numbers, and hyphens only."
    );
  }

  return valid(normalized);
}

export function validateTicker(ticker: unknown): ValidationResult<string> {
  const normalized = getStringValue(ticker).toUpperCase();

  if (!normalized) {
    return invalid("Ticker is required.");
  }

  if (normalized.length > 20) {
    return invalid("Ticker must be 20 characters or fewer.");
  }

  if (!tickerPattern.test(normalized)) {
    return invalid(
      "Ticker may contain letters, numbers, periods, and hyphens only."
    );
  }

  return valid(normalized);
}

export function getSensitivePreviewTerm(value: string | null) {
  const match = value?.match(sensitivePreviewPattern);

  return match?.[0] ?? null;
}

export function validateContentVisibility(value: unknown) {
  return validateEnumValue(value, contentVisibilityValues, "Visibility");
}

export function validateIdeaStatus(value: unknown) {
  return validateEnumValue(value, ideaStatusValues, "Idea status");
}

export function validateIdeaBias(value: unknown) {
  return validateEnumValue(value, ideaBiasValues, "Idea bias");
}

export function validateAssetClass(value: unknown) {
  return validateEnumValue(value, assetClassValues, "Asset class");
}

export function validateRiskLevel(value: unknown) {
  return validateEnumValue(value, riskLevelValues, "Risk level");
}

export function validateChartType(value: unknown) {
  return validateEnumValue(value, chartTypeValues, "Chart type");
}

export function parsePublishedAt(
  value: unknown
): ValidationResult<string | null> {
  const normalized = normalizeEmptyString(value);

  if (!normalized) {
    return valid(null);
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return invalid("Published date must be a valid date.");
  }

  return valid(date.toISOString());
}
