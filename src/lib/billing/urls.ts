import "server-only";

import { headers } from "next/headers";

import { getSiteUrl } from "@/lib/supabase/env";

import { validateInternalReturnPath } from "./validation";

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

export async function getBaseUrlFromRequest(request?: Request) {
  const requestOrigin = normalizeOrigin(request?.headers.get("origin") ?? null);

  if (requestOrigin) {
    return requestOrigin;
  }

  const requestHost = normalizeHost(request?.headers.get("host") ?? null);

  if (requestHost) {
    return `${getProtocol(
      requestHost,
      request?.headers.get("x-forwarded-proto") ?? null
    )}://${requestHost}`;
  }

  try {
    const headerStore = await headers();
    const headerOrigin = normalizeOrigin(headerStore.get("origin"));

    if (headerOrigin) {
      return headerOrigin;
    }

    const host =
      normalizeHost(headerStore.get("x-forwarded-host")) ??
      normalizeHost(headerStore.get("host"));

    if (host) {
      return `${getProtocol(host, headerStore.get("x-forwarded-proto"))}://${host}`;
    }
  } catch {
    // Static import/build contexts do not always have request headers.
  }

  try {
    return getSiteUrl();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:3000";
    }

    throw new Error("Unable to determine billing return URL origin.");
  }
}

function buildUrl(origin: string, path: string, params: Record<string, string>) {
  const url = new URL(path, origin);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export async function getCheckoutSuccessUrl(returnPath = "/account") {
  const origin = await getBaseUrlFromRequest();
  const next = validateInternalReturnPath(returnPath, "/account");

  return buildUrl(origin, next, {
    billing: "success",
  });
}

export async function getCheckoutCancelUrl(returnPath = "/pricing") {
  const origin = await getBaseUrlFromRequest();
  const next = validateInternalReturnPath(returnPath, "/pricing");

  return buildUrl(origin, next, {
    billing: "cancelled",
  });
}

export async function getBillingReturnUrl(returnPath = "/account") {
  const origin = await getBaseUrlFromRequest();
  const next = validateInternalReturnPath(returnPath, "/account");

  return buildUrl(origin, next, {});
}
