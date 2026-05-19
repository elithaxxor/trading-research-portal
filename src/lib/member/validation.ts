import type {
  AssetClass,
  ContentVisibility,
  IdeaStatus,
} from "@/lib/content/types";
import {
  assetClassValues,
  contentVisibilityValues,
  ideaStatusValues,
} from "@/lib/content/search-params";

import type {
  MemberDashboardView,
  MemberPreferencesInput,
  MemberSortPreference,
} from "./types";

export const memberDashboardViewValues = [
  "overview",
  "watchlist",
  "saved",
  "following",
  "recent",
  "closed",
  "software",
] as const satisfies readonly MemberDashboardView[];

export const memberSortPreferenceValues = [
  "recently_updated",
  "newest_published",
  "lifecycle_recent",
  "status",
  "ticker",
] as const satisfies readonly MemberSortPreference[];

function isAllowedValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): value is T {
  return typeof value === "string" && allowedValues.includes(value as T);
}

function normalizeOptionalText(
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

function validateEnumArray<T extends string>({
  allowedValues,
  fieldName,
  values,
}: {
  allowedValues: readonly T[];
  fieldName: string;
  values: readonly T[] | undefined;
}) {
  if (!values) {
    return undefined;
  }

  const uniqueValues = Array.from(new Set(values));
  const invalidValue = uniqueValues.find(
    (value) => !allowedValues.includes(value)
  );

  if (invalidValue) {
    throw new Error(`${fieldName} contains an unsupported value.`);
  }

  return uniqueValues;
}

export function validateTicker(ticker: string) {
  const normalized = ticker.trim().toUpperCase();

  if (!normalized) {
    throw new Error("Ticker is required.");
  }

  if (normalized.length > 20) {
    throw new Error("Ticker must be 20 characters or fewer.");
  }

  if (!/^[A-Z0-9.-]+$/.test(normalized)) {
    throw new Error("Ticker may contain only letters, numbers, dots, or dashes.");
  }

  return normalized;
}

export function validateMemberNote(
  note: string | null | undefined,
  options: { required?: boolean } = {}
) {
  return normalizeOptionalText(note, {
    fieldName: "Note",
    maxLength: 2000,
    required: options.required,
  });
}

export function validateDashboardView(value: unknown): MemberDashboardView {
  if (!isAllowedValue(value, memberDashboardViewValues)) {
    throw new Error("Unsupported dashboard view.");
  }

  return value;
}

export function validateSortPreference(value: unknown): MemberSortPreference {
  if (!isAllowedValue(value, memberSortPreferenceValues)) {
    throw new Error("Unsupported dashboard sort preference.");
  }

  return value;
}

export function validateDashboardPreferences(input: MemberPreferencesInput) {
  const output: MemberPreferencesInput = {};

  if (input.default_view !== undefined) {
    output.default_view = validateDashboardView(input.default_view);
  }

  if (input.default_sort !== undefined) {
    output.default_sort = validateSortPreference(input.default_sort);
  }

  if (input.show_locked_previews !== undefined) {
    output.show_locked_previews = Boolean(input.show_locked_previews);
  }

  if (input.show_charts_on_dashboard !== undefined) {
    output.show_charts_on_dashboard = Boolean(input.show_charts_on_dashboard);
  }

  if (input.show_closed_reviews !== undefined) {
    output.show_closed_reviews = Boolean(input.show_closed_reviews);
  }

  if (input.show_software_section !== undefined) {
    output.show_software_section = Boolean(input.show_software_section);
  }

  const preferredAssetClasses = validateEnumArray<AssetClass>({
    allowedValues: assetClassValues,
    fieldName: "Preferred asset classes",
    values: input.preferred_asset_classes,
  });

  if (preferredAssetClasses !== undefined) {
    output.preferred_asset_classes = preferredAssetClasses;
  }

  const preferredStatuses = validateEnumArray<IdeaStatus>({
    allowedValues: ideaStatusValues,
    fieldName: "Preferred statuses",
    values: input.preferred_statuses,
  });

  if (preferredStatuses !== undefined) {
    output.preferred_statuses = preferredStatuses;
  }

  const preferredVisibility = validateEnumArray<ContentVisibility>({
    allowedValues: contentVisibilityValues,
    fieldName: "Preferred visibility",
    values: input.preferred_visibility,
  });

  if (preferredVisibility !== undefined) {
    output.preferred_visibility = preferredVisibility;
  }

  return output;
}
