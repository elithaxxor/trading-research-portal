import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAdminPostById } from "@/lib/admin/posts";
import { requireAdmin } from "@/lib/auth/admin";
import { formatVisibilityLabel } from "@/lib/content/format";
import { cn } from "@/lib/utils";

import { ResearchPostForm } from "../../post-form";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/posts/edit",
  },
  description: "Admin-only research post editing workspace.",
  title: "Edit Research Post",
};

export const dynamic = "force-dynamic";

type AdminEditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditPostPage({
  params,
}: AdminEditPostPageProps) {
  await requireAdmin("/admin/posts");

  const { id } = await params;
  const post = await getAdminPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={`/research/${post.slug}`}
          >
            <ExternalLink data-icon="inline-start" />
            View Public Page
          </Link>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/posts", label: "Posts" },
          { label: "Edit Post" },
        ]}
        description="Edit plain-text research copy, access visibility, safe excerpt, and publishing state."
        eyebrow="Research Posts"
        title="Edit research post"
      />

      <div className="flex flex-wrap gap-2">
        <Badge tone="muted">{formatVisibilityLabel(post.visibility)}</Badge>
        <Badge tone={post.published ? "positive" : "muted"}>
          {post.published ? "Published" : "Draft"}
        </Badge>
      </div>

      <ResearchPostForm mode="edit" post={post} />
    </div>
  );
}
