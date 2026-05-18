import type {
  AssetClass,
  ContentVisibility,
  IdeaOutcome,
  IdeaPreviewSort,
  IdeaStatus,
} from "@/lib/content/types";

export type SearchParamValue = string | string[] | undefined;

export const DEFAULT_CONTENT_PAGE_SIZE = 12;
export const MAX_CONTENT_PAGE_SIZE = 24;

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

export const ideaStatusValues = [
  "watching",
  "active",
  "triggered",
  "invalidated",
  "target_hit",
  "closed",
] as const satisfies readonly IdeaStatus[];

export const contentVisibilityValues = [
  "free",
  "premium",
  "pro",
] as const satisfies readonly ContentVisibility[];

export const ideaOutcomeValues = [
  "pending",
  "no_trade",
  "invalidated",
  "stopped_out",
  "target_1_hit",
  "target_2_hit",
  "target_3_hit",
  "partial_win",
  "win",
  "loss",
  "breakeven",
  "closed_manual",
] as const satisfies readonly IdeaOutcome[];

export const ideaPreviewSortValues = [
  "published",
  "updated",
  "lifecycle",
  "closed",
] as const satisfies readonly IdeaPreviewSort[];

export function getFirstSearchParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSearchQuery(value: SearchParamValue) {
  const query = getFirstSearchParam(value)?.trim().replace(/\s+/g, " ");

  if (!query) {
    return undefined;
  }

  return query.slice(0, 120);
}

export function parseEnumSearchParam<T extends string>(
  value: SearchParamValue,
  allowedValues: readonly T[]
) {
  const firstValue = getFirstSearchParam(value);

  if (!firstValue) {
    return undefined;
  }

  return allowedValues.includes(firstValue as T) ? (firstValue as T) : undefined;
}

export function parsePageSearchParam(value: SearchParamValue) {
  const page = Number(getFirstSearchParam(value) ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseBooleanSearchParam(value: SearchParamValue) {
  const firstValue = getFirstSearchParam(value)?.toLowerCase();

  return (
    firstValue === "1" ||
    firstValue === "true" ||
    firstValue === "on" ||
    firstValue === "yes"
  );
}

export function getContentPageSize(size = DEFAULT_CONTENT_PAGE_SIZE) {
  if (!Number.isFinite(size)) {
    return DEFAULT_CONTENT_PAGE_SIZE;
  }

  return Math.min(Math.max(Math.floor(size), 1), MAX_CONTENT_PAGE_SIZE);
}

export function buildContentPageHref({
  assetClass,
  basePath,
  closedReviews,
  outcome,
  page,
  query,
  sort,
  status,
  updatedRecently,
  visibility,
}: {
  assetClass?: AssetClass;
  basePath: string;
  closedReviews?: boolean;
  outcome?: IdeaOutcome;
  page: number;
  query?: string;
  sort?: IdeaPreviewSort;
  status?: IdeaStatus;
  updatedRecently?: boolean;
  visibility?: ContentVisibility;
}) {
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set("q", query);
  }

  if (assetClass) {
    searchParams.set("asset_class", assetClass);
  }

  if (status) {
    searchParams.set("status", status);
  }

  if (outcome) {
    searchParams.set("outcome", outcome);
  }

  if (visibility) {
    searchParams.set("visibility", visibility);
  }

  if (sort && sort !== "published") {
    searchParams.set("sort", sort);
  }

  if (updatedRecently) {
    searchParams.set("updated_recently", "1");
  }

  if (closedReviews) {
    searchParams.set("closed_reviews", "1");
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const queryString = searchParams.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}
