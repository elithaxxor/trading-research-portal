import {
  allowedIdeaOutcomes,
  allowedIdeaStatuses,
  allowedLifecycleEventTypes,
} from "./constants";
import type {
  IdeaLifecycleEventType,
  IdeaOutcome,
  IdeaStatus,
  LifecycleUpdateInput,
  ValidatedLifecycleUpdateInput,
  ValidationResult,
} from "./types";

const outcomeSummaryMaxLength = 2000;
const lessonsLearnedMaxLength = 4000;
const updateTitleMaxLength = 160;
const updateBodyMaxLength = 8000;

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

function normalizeNullableString(value: unknown) {
  const normalized = getStringValue(value);

  return normalized ? normalized : null;
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

function validateOptionalEnumValue<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  label: string
): ValidationResult<TValue | null> {
  const normalized = normalizeNullableString(value);

  if (!normalized) {
    return valid(null);
  }

  if (!allowedValues.includes(normalized as TValue)) {
    return invalid(`Choose a valid ${label.toLowerCase()}.`);
  }

  return valid(normalized as TValue);
}

function validateOptionalText(
  value: unknown,
  maxLength: number,
  label: string
): ValidationResult<string | null> {
  const normalized = normalizeNullableString(value);

  if (!normalized) {
    return valid(null);
  }

  if (normalized.length > maxLength) {
    return invalid(`${label} must be ${maxLength} characters or fewer.`);
  }

  return valid(normalized);
}

function validateRequiredText(
  value: unknown,
  maxLength: number,
  label: string
): ValidationResult<string> {
  const normalized = getStringValue(value);

  if (!normalized) {
    return invalid(`${label} is required.`);
  }

  if (normalized.length > maxLength) {
    return invalid(`${label} must be ${maxLength} characters or fewer.`);
  }

  return valid(normalized);
}

function validateLifecycleDate(value: unknown): ValidationResult<string> {
  const normalized = normalizeNullableString(value);

  if (!normalized) {
    return valid(new Date().toISOString());
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return invalid("Lifecycle event date must be valid.");
  }

  return valid(date.toISOString());
}

function getBooleanValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return false;
}

export function validateLifecycleStatus(value: unknown) {
  return validateEnumValue<IdeaStatus>(
    value,
    allowedIdeaStatuses,
    "Idea status"
  );
}

export function validateOutcome(value: unknown) {
  return validateEnumValue<IdeaOutcome>(value, allowedIdeaOutcomes, "Outcome");
}

export function validateLifecycleEventType(value: unknown) {
  return validateEnumValue<IdeaLifecycleEventType>(
    value,
    allowedLifecycleEventTypes,
    "Lifecycle event type"
  );
}

export function validateOutcomeSummary(value: unknown) {
  return validateOptionalText(
    value,
    outcomeSummaryMaxLength,
    "Outcome summary"
  );
}

export function validateLessonsLearned(value: unknown) {
  return validateOptionalText(
    value,
    lessonsLearnedMaxLength,
    "Lessons learned"
  );
}

export function validateLifecycleUpdateInput(
  input: LifecycleUpdateInput
): ValidationResult<ValidatedLifecycleUpdateInput> {
  const titleResult = validateRequiredText(
    input.title,
    updateTitleMaxLength,
    "Update title"
  );

  if (!titleResult.ok) {
    return titleResult;
  }

  const bodyResult = validateOptionalText(
    input.body,
    updateBodyMaxLength,
    "Update body"
  );

  if (!bodyResult.ok) {
    return bodyResult;
  }

  const eventTypeResult = input.event_type
    ? validateLifecycleEventType(input.event_type)
    : valid<IdeaLifecycleEventType>("note");

  if (!eventTypeResult.ok) {
    return eventTypeResult;
  }

  const statusBeforeResult = validateOptionalEnumValue<IdeaStatus>(
    input.status_before,
    allowedIdeaStatuses,
    "Status before"
  );

  if (!statusBeforeResult.ok) {
    return statusBeforeResult;
  }

  const statusAfterResult = validateOptionalEnumValue<IdeaStatus>(
    input.status_after_update,
    allowedIdeaStatuses,
    "Status after"
  );

  if (!statusAfterResult.ok) {
    return statusAfterResult;
  }

  const outcomeAfterResult = validateOptionalEnumValue<IdeaOutcome>(
    input.outcome_after,
    allowedIdeaOutcomes,
    "Outcome after"
  );

  if (!outcomeAfterResult.ok) {
    return outcomeAfterResult;
  }

  const eventAtResult = validateLifecycleDate(input.event_at);

  if (!eventAtResult.ok) {
    return eventAtResult;
  }

  return valid({
    body: bodyResult.value,
    event_at: eventAtResult.value,
    event_type: eventTypeResult.value,
    is_major: getBooleanValue(input.is_major),
    outcome_after: outcomeAfterResult.value,
    status_after_update: statusAfterResult.value,
    status_before: statusBeforeResult.value,
    title: titleResult.value,
  });
}
