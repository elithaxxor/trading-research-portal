import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

type DashboardLayoutProps = {
  children: ReactNode;
};

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Fdashboard");
}

function formatTier(subscription: Pick<SubscriptionRow, "tier"> | null) {
  const tier = subscription?.tier ?? "free";

  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function formatStatus(
  subscription: Pick<SubscriptionRow, "status"> | null
) {
  if (!subscription) {
    return "Free access";
  }

  return subscription.status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function getDashboardLayoutContext() {
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    loginRedirect();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    loginRedirect();
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier,status")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    statusLabel: formatStatus(subscription),
    tierLabel: formatTier(subscription),
    userEmail: user.email ?? "Signed-in member",
  };
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { statusLabel, tierLabel, userEmail } =
    await getDashboardLayoutContext();

  return (
    <DashboardShell
      statusLabel={statusLabel}
      tierLabel={tierLabel}
      userEmail={userEmail}
    >
      {children}
    </DashboardShell>
  );
}
