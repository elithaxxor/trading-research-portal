const fallbackDescription =
  "Chart-based trading research, market commentary, watchlists, and risk-aware trading ideas organized in one private dashboard.";

export function getPublicMetadataUrl(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return path;
  }

  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return path;
  }
}

export function getSafeMetadataDescription(
  description?: string | null,
  fallback = fallbackDescription
) {
  const normalized = description?.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, 180);
}
