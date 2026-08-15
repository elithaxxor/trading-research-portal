import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database.types";

import { getSupabaseServerConfig } from "./env";

const protectedRoutePrefixes = ["/dashboard", "/account", "/admin"];
const authRoutes = ["/login", "/register"];
const authRequestTimeoutMs = 3_000;

async function fetchWithAuthTimeout(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), authRequestTimeoutMs);
  const abortFromCaller = () => controller.abort();

  init?.signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener("abort", abortFromCaller);
  }
}

async function withAuthTimeout<T>(request: Promise<T>) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Supabase auth request timed out.")),
          authRequestTimeoutMs
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some((prefix) =>
    matchesRoutePrefix(pathname, prefix)
  );
}

function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

function isAuthAwareRoute(pathname: string) {
  return isProtectedRoute(pathname) || isAuthRoute(pathname);
}

function createPassThroughResponse(request: NextRequest) {
  return NextResponse.next({
    request,
  });
}

function copySessionState(source: NextResponse, destination: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    destination.cookies.set(cookie);
  });

  source.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey !== "set-cookie" &&
      !normalizedKey.startsWith("x-middleware-")
    ) {
      destination.headers.set(key, value);
    }
  });
}

function createRedirectWithSessionCookies(
  request: NextRequest,
  responseWithSessionCookies: NextResponse,
  pathname: string
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  const redirectResponse = NextResponse.redirect(redirectUrl);

  copySessionState(responseWithSessionCookies, redirectResponse);

  return redirectResponse;
}

function createLoginRedirect(
  request: NextRequest,
  responseWithSessionCookies: NextResponse
) {
  const redirectUrl = request.nextUrl.clone();
  const redirectedFrom = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("redirectedFrom", redirectedFrom);

  const redirectResponse = NextResponse.redirect(redirectUrl);

  copySessionState(responseWithSessionCookies, redirectResponse);

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isAuthAwareRoute(pathname)) {
    return createPassThroughResponse(request);
  }

  let response = createPassThroughResponse(request);
  let supabaseConfig: ReturnType<typeof getSupabaseServerConfig>;

  try {
    supabaseConfig = getSupabaseServerConfig();
  } catch {
    if (isProtectedRoute(pathname)) {
      return createLoginRedirect(request, response);
    }

    return response;
  }

  const { supabaseUrl, supabasePublishableKey } = supabaseConfig;

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      global: {
        fetch: fetchWithAuthTimeout,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = createPassThroughResponse(request);

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    }
  );

  let user: User | null = null;

  try {
    const result: { data: { user: User | null } } =
      await withAuthTimeout(supabase.auth.getUser());
    user = result.data.user;
  } catch {
    user = null;
  }

  if (!user && isProtectedRoute(pathname)) {
    return createLoginRedirect(request, response);
  }

  if (user && isAuthRoute(pathname)) {
    return createRedirectWithSessionCookies(request, response, "/dashboard");
  }

  return response;
}
