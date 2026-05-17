import type {
  AssetClass,
  ContentVisibility,
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

export function getContentPageSize(size = DEFAULT_CONTENT_PAGE_SIZE) {
  if (!Number.isFinite(size)) {
    return DEFAULT_CONTENT_PAGE_SIZE;
  }

  return Math.min(Math.max(Math.floor(size), 1), MAX_CONTENT_PAGE_SIZE);
}

export function buildContentPageHref({
  assetClass,
  basePath,
  page,
  query,
  status,
  visibility,
}: {
  assetClass?: AssetClass;
  basePath: string;
  page: number;
  query?: string;
  status?: IdeaStatus;
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

  if (visibility) {
    searchParams.set("visibility", visibility);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const queryString = searchParams.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}
