import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdmin } from "@/lib/auth/admin";

import { NewIdeaForm } from "./new-idea-form";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/ideas/new",
  },
  description:
    "Admin-only new trading idea workspace for Trading Research Portal.",
  title: "New Trading Idea",
};

export const dynamic = "force-dynamic";

export default async function AdminNewIdeaPage() {
  await requireAdmin("/admin/ideas/new");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/ideas", label: "Ideas" },
          { label: "New Idea" },
        ]}
        description="Create a structured trading idea with safe public preview copy, access visibility, risk fields, and educational disclosures."
        eyebrow="Trading Ideas"
        title="New trading idea"
      />

      <NewIdeaForm />
    </div>
  );
}
