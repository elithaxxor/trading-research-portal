import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  formatSubscriptionAccessState,
  formatSubscriptionStatus,
  formatSubscriptionTier,
} from "@/lib/billing/format";
import { getEffectiveSubscriptionTier } from "@/lib/billing/tiers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: ReactNode;
};

function loginRedirect(): never {
  redirect("/login?redirectedFrom=%2Fdashboard");
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

  const [subscriptionResult, profileResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);

  const subscription = subscriptionResult.data;
  const isAdmin = profileResult.data?.role === "admin";
  const effectiveTier = getEffectiveSubscriptionTier(
    subscription?.tier,
    subscription?.status,
    false
  );

  return {
    accessLabel: isAdmin
      ? "Admin management access"
      : formatSubscriptionAccessState(subscription?.tier, subscription?.status),
    accountTierLabel: formatSubscriptionTier(subscription?.tier),
    statusLabel: formatSubscriptionStatus(subscription?.status),
    userEmail: user.email ?? "Signed-in member",
    workspaceLabel: isAdmin
      ? "Admin"
      : formatSubscriptionTier(effectiveTier),
  };
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const {
    accessLabel,
    accountTierLabel,
    statusLabel,
    userEmail,
    workspaceLabel,
  } = await getDashboardLayoutContext();

  return (
    <DashboardShell
      accessLabel={accessLabel}
      accountTierLabel={accountTierLabel}
      statusLabel={statusLabel}
      userEmail={userEmail}
      workspaceLabel={workspaceLabel}
    >
      {children}
    </DashboardShell>
  );
}
