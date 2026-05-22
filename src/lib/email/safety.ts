import "server-only";

import { getSiteUrl } from "@/lib/supabase/env";

const PRIVATE_MARKERS = [
  "entry_zone",
  "invalidation_level",
  "target_1",
  "target_2",
  "target_3",
  "targets",
  "thesis",
  "outcome_summary",
  "lessons_learned",
  "private_pine_source",
  "pine_source",
  "tradingview_script_url",
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stripUnsafeHtml(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeEmailHtml(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const text = stripUnsafeHtml(value);

  return escapeHtml(text).replace(/\n/g, "<br>");
}

export function createSafePreviewText(
  value: string | null | undefined,
  maxLength = 180
) {
  const preview = stripUnsafeHtml(value).replace(/\s+/g, " ").trim();

  if (preview.length <= maxLength) {
    return preview;
  }

  return `${preview.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export function assertNoPrivateMarkersForUnauthorizedEmail(
  body: string | null | undefined
) {
  const text = (body ?? "").toLowerCase();
  const marker = PRIVATE_MARKERS.find((privateMarker) =>
    text.includes(privateMarker.toLowerCase())
  );

  if (marker) {
    throw new Error(
      `Email body contains private marker "${marker}" for unauthorized recipient.`
    );
  }
}

export function buildProtectedAppLink(path: string) {
  const normalizedPath =
    path.startsWith("/") && !path.startsWith("//") ? path : "/";

  return `${getSiteUrl()}${normalizedPath}`;
}
