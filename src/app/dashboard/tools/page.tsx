import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { SoftwareLockedPanel } from "@/components/software/SoftwareLockedPanel";
import {
  canAccessToolsLibrary,
  getCurrentSoftwareAccessTier,
} from "@/lib/software/access";
import {
  listAdminSoftwareProducts,
  listSoftwareProductPreviews,
} from "@/lib/software/products";
import { listMySoftwareAccessRequests } from "@/lib/software/requests";

export const metadata: Metadata = { title: "Pro Tools" };
export const dynamic = "force-dynamic";

export default async function ProToolsPage() {
  const access = await getCurrentSoftwareAccessTier();
  const canAccess = canAccessToolsLibrary(access.userTier, access.isAdmin);

  if (!canAccess) {
    return (
      <div className="grid gap-8">
        <DashboardPageHeader
          breadcrumbs={[
            { href: "/dashboard", label: "Dashboard" },
            { label: "Tools" },
          ]}
          description="The Tools workspace is reserved for active Pro members and administrators."
          eyebrow="Pro workspace"
          title="Tools"
        />
        <SoftwareLockedPanel
          message="Upgrade to Pro to access the Tools workspace."
          reason="An active Pro membership is required."
        />
      </div>
    );
  }

  const [productsResult, requests] = await Promise.all([
    access.isAdmin
      ? listAdminSoftwareProducts({
          limit: 48,
          published: true,
          softwareType: "tool",
        })
      : listSoftwareProductPreviews({ limit: 48, softwareType: "tool" }),
    listMySoftwareAccessRequests().catch(() => []),
  ]);
  const requestsByProductId = new Map(
    requests.map((request) => [request.software_product_id, request.status])
  );

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Tools" },
        ]}
        description="Pro-only research tools, documentation, protected downloads, and manual-access workflows."
        eyebrow="Pro workspace"
        title="Tools"
      />

      <DashboardStatCard
        description="Published tools available to this Pro workspace."
        icon={PackageSearch}
        label="Available tools"
        value={String(productsResult.items.length)}
      />

      <DashboardSection
        description="Tools remain protected by server-side subscription checks and database access policies."
        title="Pro tools"
      >
        {productsResult.items.length ? (
          <div className="grid gap-5 xl:grid-cols-3">
            {productsResult.items.map((product) => (
              <SoftwareCard
                key={product.id}
                product={product}
                requestStatus={requestsByProductId.get(product.id)}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            description="Published software products marked as Tools will appear here."
            title="No tools published"
          />
        )}
      </DashboardSection>
    </div>
  );
}

