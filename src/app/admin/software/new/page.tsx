import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdmin } from "@/lib/auth/admin";

import { SoftwareProductForm } from "../software-form";

export const metadata: Metadata = {
  title: "New Admin Software",
};

export const dynamic = "force-dynamic";

export default async function NewSoftwareProductPage() {
  await requireAdmin("/admin/software/new");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/software", label: "Software" },
          { label: "New" },
        ]}
        description="Create tier-gated software documentation and manual access workflow records."
        eyebrow="Software"
        title="New software product"
      />
      <SoftwareProductForm mode="create" />
    </div>
  );
}
