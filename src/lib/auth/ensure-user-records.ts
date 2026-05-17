import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EnsureUserRecordsResult = {
  profileCreated: boolean;
  subscriptionCreated: boolean;
};

function getFullName(user: User) {
  const fullName = user.user_metadata?.full_name;

  return typeof fullName === "string" && fullName.trim()
    ? fullName.trim()
    : null;
}

// Profiles and subscriptions are protected by RLS. This repair utility first
// checks the current user's rows with the normal server client, then uses the
// server-only admin client only to insert missing rows for that same verified
// Supabase Auth user. It never accepts a user id from client input.
export async function ensureUserRecords(
  user: User
): Promise<EnsureUserRecordsResult> {
  if (!user?.id) {
    throw new Error("Cannot bootstrap records without an authenticated user.");
  }

  const supabase = await createSupabaseServerClient();
  const [profileResult, subscriptionResult] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profileMissing = !profileResult.data;
  const subscriptionMissing = !subscriptionResult.data;

  if (!profileMissing && !subscriptionMissing) {
    return {
      profileCreated: false,
      subscriptionCreated: false,
    };
  }

  const admin = createSupabaseAdminClient();

  if (profileMissing) {
    const { error } = await admin.from("profiles").upsert(
      {
        email: user.email ?? null,
        full_name: getFullName(user),
        id: user.id,
        role: "user",
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      throw new Error("Unable to bootstrap the user profile record.");
    }
  }

  if (subscriptionMissing) {
    const { error } = await admin.from("subscriptions").upsert(
      {
        status: "none",
        tier: "free",
        user_id: user.id,
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      throw new Error("Unable to bootstrap the user subscription record.");
    }
  }

  return {
    profileCreated: profileMissing,
    subscriptionCreated: subscriptionMissing,
  };
}
