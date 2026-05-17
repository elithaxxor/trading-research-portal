import "server-only";

import { headers } from "next/headers";

import { getSiteUrl } from "@/lib/supabase/env";

function normalizeOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeHost(value: string | null) {
  const host = value?.split(",")[0]?.trim();

  if (!host || host.includes("/") || host.includes("\\")) {
    return null;
  }

  return host;
}

function getProtocol(host: string, forwardedProto: string | null) {
  const protocol = forwardedProto?.split(",")[0]?.trim();

  if (protocol === "http" || protocol === "https") {
    return protocol;
  }

  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return "http";
  }

  return "https";
}

export async function getRequestOrigin() {
  const headerStore = await headers();
  const requestOrigin = normalizeOrigin(headerStore.get("origin"));

  if (requestOrigin) {
    return requestOrigin;
  }

  const host =
    normalizeHost(headerStore.get("x-forwarded-host")) ??
    normalizeHost(headerStore.get("host"));

  if (!host) {
    return null;
  }

  const protocol = getProtocol(host, headerStore.get("x-forwarded-proto"));

  return `${protocol}://${host}`;
}

export async function getAuthRedirectOrigin() {
  const requestOrigin = await getRequestOrigin();

  if (requestOrigin) {
    return requestOrigin;
  }

  try {
    return getSiteUrl();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:3000";
    }

    return null;
  }
}

export function buildAuthCallbackUrl(origin: string, nextPath?: string) {
  const callbackUrl = new URL("/auth/callback", origin);

  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  return callbackUrl.toString();
}
