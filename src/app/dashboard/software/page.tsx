import type { Metadata } from "next";
import { Wrench } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { MemberActionNotice } from "@/components/member-action-notice";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { SoftwareLockedPanel } from "@/components/software/SoftwareLockedPanel";
import { formatSubscriptionStatus } from "@/lib/billing/format";
import { getCurrentSoftwareAccessTier } from "@/lib/software/access";
import {
  listAdminSoftwareProducts,
  listSoftwareProductPreviews,
} from "@/lib/software/products";
import { listMySoftwareAccessRequests } from "@/lib/software/requests";

export const metadata: Metadata = {
  title: "Software Library",
};

export const dynamic = "force-dynamic";

type SoftwareLibraryPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export default async function SoftwareLibraryPage({
  searchParams,
}: SoftwareLibraryPageProps) {
  const params = await searchParams;
  const access = await getCurrentSoftwareAccessTier();
  const { isAdmin, userTier } = access;
  const canViewSoftware = isAdmin || userTier === "premium" || userTier === "pro";
  const accessMessage = getSoftwareAccessMessage(access);
  const [productsResult, requests] = await Promise.all([
    isAdmin
      ? listAdminSoftwareProducts({ limit: 48 })
      : listSoftwareProductPreviews({ limit: 48 }),
    canViewSoftware ? listMySoftwareAccessRequests().catch(() => []) : [],
  ]);
  const products = productsResult.items;
  const requestsByProductId = new Map(
    requests.map((request) => [request.software_product_id, request.status])
  );

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Software Library" },
        ]}
        description="Tier-gated software documentation and manual access workflows for Premium and Pro members."
        title="Software Library"
      />

      <MemberActionNotice notice={params?.notice} />

      <DashboardStatCard
        description={accessMessage}
        icon={Wrench}
        label="Available"
        value={String(products.length)}
      />

      <SoftwareAccessSummary
        isInactivePaidTier={
          !access.isAccessActive &&
          (access.accountTier === "premium" || access.accountTier === "pro")
        }
        message={accessMessage}
      />

      {!canViewSoftware ? (
        <SoftwareLockedPanel message={accessMessage} />
      ) : (
        <DashboardSection
          description="Premium members can access Lite software. Pro members can access Lite and Pro software."
          title="Available software"
        >
          {products.length > 0 ? (
            <div className="grid gap-5 xl:grid-cols-3">
              {products.map((product) => (
                <SoftwareCard
                  key={product.id}
                  product={product}
                  requestStatus={requestsByProductId.get(product.id)}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              description="No software products are currently available for your tier."
              title="No software available"
            />
          )}
        </DashboardSection>
      )}
    </div>
  );
}

function SoftwareAccessSummary({
  isInactivePaidTier,
  message,
}: {
  isInactivePaidTier: boolean;
  message: string;
}) {
  return (
    <CardShell padding="md" tone={isInactivePaidTier ? "elevated" : "subtle"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone={isInactivePaidTier ? "gold" : "muted"}>
            Software access
          </Badge>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {message}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            TradingView invite-only access remains a manual admin workflow. No
            automatic invite automation is active.
          </p>
        </div>
      </div>
    </CardShell>
  );
}

function getSoftwareAccessMessage(
  access: Awaited<ReturnType<typeof getCurrentSoftwareAccessTier>>
) {
  if (access.isAdmin) {
    return "Admin: all software products are visible for management review.";
  }

  if (
    !access.isAccessActive &&
    (access.accountTier === "premium" || access.accountTier === "pro")
  ) {
    return `Paid access is currently inactive (${formatSubscriptionStatus(access.billingStatus)}). Software access requires Premium or Pro with active billing.`;
  }

  if (access.userTier === "premium") {
    return "Premium: Lite software access.";
  }

  if (access.userTier === "pro") {
    return "Pro: Lite + Pro software access.";
  }

  return "Software access requires Premium or Pro.";
}
