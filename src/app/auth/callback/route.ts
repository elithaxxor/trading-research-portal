import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(nextPath: string | null) {
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }

  return "/dashboard";
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const loginUrl = new URL("/login", request.url);

  if (reason) {
    loginUrl.searchParams.set("authError", reason);
  }

  return NextResponse.redirect(loginUrl);
}

// Supabase Auth email flows redirect here with a short-lived code. Exchanging
// it server-side stores the resulting session in HttpOnly cookies before the
// user is sent to the requested internal destination.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return redirectToLogin(request, "missing_code");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToLogin(request, "callback_failed");
    }
  } catch {
    return redirectToLogin(request, "callback_failed");
  }

  return redirectTo(request, nextPath);
}
