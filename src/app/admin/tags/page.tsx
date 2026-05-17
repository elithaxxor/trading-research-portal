import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listTagsWithUsage } from "@/lib/admin/tags";
import { requireAdmin } from "@/lib/auth/admin";

import { TagManagement } from "./tag-management";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/tags",
  },
  description: "Admin-only tag management workspace for Trading Research Portal.",
  title: "Admin Tags",
};

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  await requireAdmin("/admin/tags");

  const tags = await listTagsWithUsage();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Tags" },
        ]}
        description="Create, edit, and safely remove taxonomy used to organize trading ideas by market theme, education topic, sector, or setup type."
        eyebrow="Tags"
        title="Tags"
      />

      <TagManagement tags={tags} />
    </div>
  );
}
