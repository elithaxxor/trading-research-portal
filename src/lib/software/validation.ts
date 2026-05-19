import type {
  SoftwareAccessRequestStatus,
  SoftwareAccessTier,
  SoftwareDeliveryType,
  SoftwareType,
} from "./types";

export const softwareAccessTierValues = [
  "premium_lite",
  "pro",
] as const satisfies readonly SoftwareAccessTier[];

export const softwareTypeValues = [
  "pinescript",
  "indicator",
  "strategy",
  "template",
  "tool",
  "guide",
  "other",
] as const satisfies readonly SoftwareType[];

export const softwareDeliveryTypeValues = [
  "tradingview_invite_only",
  "protected_download",
  "documentation_only",
  "external_link",
  "manual_access",
] as const satisfies readonly SoftwareDeliveryType[];

export const softwareAccessRequestStatusValues = [
  "requested",
  "approved",
  "rejected",
  "granted",
  "revoked",
  "needs_info",
] as const satisfies readonly SoftwareAccessRequestStatus[];

function isAllowedValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): value is T {
  return typeof value === "string" && allowedValues.includes(value as T);
}

function validateText(
  value: string | null | undefined,
  {
    fieldName,
    maxLength,
    required = false,
  }: {
    fieldName: string;
    maxLength: number;
    required?: boolean;
  }
) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";

  if (!normalized) {
    if (required) {
      throw new Error(`${fieldName} is required.`);
    }

    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

function containsPineScriptSource(value: string) {
  const lowerValue = value.toLowerCase();

  return (
    lowerValue.includes("//@version") ||
    lowerValue.includes("indicator(") ||
    lowerValue.includes("strategy(")
  );
}

export function validateSoftwareSlug(slug: string) {
  const normalized = slug.trim().toLowerCase();

  if (!normalized) {
    throw new Error("Software slug is required.");
  }

  if (normalized.length > 100) {
    throw new Error("Software slug must be 100 characters or fewer.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error(
      "Software slug must use lowercase letters, numbers, and single hyphens."
    );
  }

  return normalized;
}

export function validateSoftwareAccessTier(value: unknown) {
  if (!isAllowedValue(value, softwareAccessTierValues)) {
    throw new Error("Unsupported software access tier.");
  }

  return value;
}

export function validateSoftwareType(value: unknown) {
  if (!isAllowedValue(value, softwareTypeValues)) {
    throw new Error("Unsupported software type.");
  }

  return value;
}

export function validateSoftwareDeliveryType(value: unknown) {
  if (!isAllowedValue(value, softwareDeliveryTypeValues)) {
    throw new Error("Unsupported software delivery type.");
  }

  return value;
}

export function validateSoftwareAccessRequestStatus(value: unknown) {
  if (!isAllowedValue(value, softwareAccessRequestStatusValues)) {
    throw new Error("Unsupported software access request status.");
  }

  return value;
}

export function validateTradingViewUsername(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return null;
  }

  if (normalized.length > 80) {
    throw new Error("TradingView username must be 80 characters or fewer.");
  }

  if (!/^[A-Za-z0-9_.-]+$/.test(normalized)) {
    throw new Error(
      "TradingView username may contain only letters, numbers, dots, underscores, or dashes."
    );
  }

  return normalized;
}

export function validateSoftwareDescription(
  value: string | null | undefined,
  options: { required?: boolean } = {}
) {
  return validateText(value, {
    fieldName: "Software description",
    maxLength: 4000,
    required: options.required,
  });
}

export function validateSoftwareDocumentation(
  value: string | null | undefined,
  options: { required?: boolean } = {}
) {
  const normalized = validateText(value, {
    fieldName: "Software documentation",
    maxLength: 20000,
    required: options.required,
  });

  if (normalized && containsPineScriptSource(normalized)) {
    throw new Error(
      "Do not store private Pine Script source code in software documentation."
    );
  }

  return normalized;
}

export function sanitizeSoftwareUrl(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return null;
  }

  if (/[<>]/.test(normalized)) {
    throw new Error("Software URLs cannot contain HTML.");
  }

  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    throw new Error("Software URL must be a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Software URL must use http or https.");
  }

  return url.toString();
}
