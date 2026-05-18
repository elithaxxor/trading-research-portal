import type { Metadata } from "next";
import { Wrench } from "lucide-react";

import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { MemberActionNotice } from "@/components/member-action-notice";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { SoftwareLockedPanel } from "@/components/software/SoftwareLockedPanel";
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
  const { isAdmin, userTier } = await getCurrentSoftwareAccessTier();
  const canViewSoftware = isAdmin || userTier === "premium" || userTier === "pro";
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
        description="TradingView invite-only access remains a manual admin workflow. No automatic invite automation is active."
        icon={Wrench}
        label="Available"
        value={String(products.length)}
      />

      {!canViewSoftware ? (
        <SoftwareLockedPanel message="Software access is available to Premium and Pro members." />
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
