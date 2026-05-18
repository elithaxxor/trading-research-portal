import type {
  MemberDashboardView,
  MemberSortPreference,
} from "./types";

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatMemberDashboardView(view: MemberDashboardView) {
  return formatEnumLabel(view);
}

export function formatMemberSortPreference(sort: MemberSortPreference) {
  return formatEnumLabel(sort);
}

export function formatMemberCountLabel(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  const safeCount = Number.isFinite(count) ? count : 0;

  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}
