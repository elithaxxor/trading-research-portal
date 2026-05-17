import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdmin } from "@/lib/auth/admin";

import { ResearchPostForm } from "../post-form";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/posts/new",
  },
  description:
    "Admin-only new research post workspace for Trading Research Portal.",
  title: "New Research Post",
};

export const dynamic = "force-dynamic";

export default async function AdminNewPostPage() {
  await requireAdmin("/admin/posts/new");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/posts", label: "Posts" },
          { label: "New Post" },
        ]}
        description="Create a plain-text research post with controlled visibility, safe excerpt copy, and publishing controls."
        eyebrow="Research Posts"
        title="New research post"
      />

      <ResearchPostForm mode="create" />
    </div>
  );
}
