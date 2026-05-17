import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type AdminProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "email" | "full_name" | "id" | "role"
>;

type AdminContext = {
  profile: AdminProfile;
  user: User;
};

type AdminAuthContext =
  | {
      profile: AdminProfile;
      status: "admin";
      user: User;
    }
  | {
      profile: AdminProfile | null;
      status: "forbidden";
      user: User;
    }
  | {
      profile: null;
      status: "unauthenticated";
      user: null;
    };

function loginRedirect(pathname: string): never {
  redirect(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
}

async function getAdminAuthContext(): Promise<AdminAuthContext> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      profile: null,
      status: "unauthenticated",
      user: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email,full_name,id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return {
      profile: profile ?? null,
      status: "forbidden",
      user,
    };
  }

  return {
    profile,
    status: "admin",
    user,
  };
}

export async function getCurrentAdmin(): Promise<AdminContext | null> {
  try {
    const context = await getAdminAuthContext();

    if (context.status !== "admin") {
      return null;
    }

    return {
      profile: context.profile,
      user: context.user,
    };
  } catch {
    return null;
  }
}

export async function isCurrentUserAdmin() {
  const admin = await getCurrentAdmin();

  return Boolean(admin);
}

// Call this at the start of every admin page, loader, and future admin server
// action. It relies on the logged-in user's normal Supabase session and RLS;
// do not replace this check with the service/admin client.
export async function requireAdmin(pathname = "/admin"): Promise<AdminContext> {
  let context: AdminAuthContext;

  try {
    context = await getAdminAuthContext();
  } catch {
    loginRedirect(pathname);
  }

  if (context.status === "unauthenticated") {
    loginRedirect(pathname);
  }

  if (context.status === "forbidden") {
    redirect("/dashboard?status=admin_required");
  }

  return {
    profile: context.profile,
    user: context.user,
  };
}
