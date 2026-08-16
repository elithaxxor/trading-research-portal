import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { SoftwareCard } from "@/components/software/SoftwareCard";
import { SoftwareLockedPanel } from "@/components/software/SoftwareLockedPanel";
import {
  canAccessStratLab,
  getCurrentSoftwareAccessTier,
} from "@/lib/software/access";
import {
  listAdminSoftwareProducts,
  listSoftwareProductPreviews,
} from "@/lib/software/products";
import { listMySoftwareAccessRequests } from "@/lib/software/requests";

export const metadata: Metadata = { title: "Strat Lab" };
export const dynamic = "force-dynamic";

export default async function StratLabPage() {
  const access = await getCurrentSoftwareAccessTier();
  const canAccess = canAccessStratLab(access.userTier, access.isAdmin);

  if (!canAccess) {
    return (
      <div className="grid gap-8">
        <DashboardPageHeader
          breadcrumbs={[
            { href: "/dashboard", label: "Dashboard" },
            { label: "Strat Lab" },
          ]}
          description="Strat Lab is reserved for active Pro members and administrators."
          eyebrow="Pro workspace"
          title="Strat Lab"
        />
        <SoftwareLockedPanel
          message="Upgrade to Pro to access Strat Lab."
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
          softwareType: "strategy",
        })
      : listSoftwareProductPreviews({ limit: 48, softwareType: "strategy" }),
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
          { label: "Strat Lab" },
        ]}
        description="Pro-only strategy research, documentation, protected downloads, and manual-access workflows."
        eyebrow="Pro workspace"
        title="Strat Lab"
      />

      <DashboardStatCard
        description="Published strategies available in this Pro workspace."
        icon={FlaskConical}
        label="Available strategies"
        value={String(productsResult.items.length)}
      />

      <DashboardSection
        description="Strategies remain protected by server-side subscription checks and database access policies."
        title="Strategy library"
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
            description="Published software products marked as Strategy will appear here."
            title="No strategies published"
          />
        )}
      </DashboardSection>
    </div>
  );
}

