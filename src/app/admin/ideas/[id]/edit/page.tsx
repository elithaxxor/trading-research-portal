import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAdminIdeaById } from "@/lib/admin/ideas";
import { listIdeaTags, listTags } from "@/lib/admin/tags";
import { requireAdmin } from "@/lib/auth/admin";
import { formatVisibilityLabel } from "@/lib/content/format";
import { cn } from "@/lib/utils";

import { EditIdeaForm } from "./edit-idea-form";
import { IdeaTagSelector } from "./idea-tag-selector";
import { LifecyclePanel } from "./lifecycle-panel";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/ideas/edit",
  },
  description: "Admin-only trading idea editing workspace.",
  title: "Edit Trading Idea",
};

export const dynamic = "force-dynamic";

type AdminEditIdeaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditIdeaPage({
  params,
}: AdminEditIdeaPageProps) {
  await requireAdmin("/admin/ideas");

  const { id } = await params;
  const idea = await getAdminIdeaById(id);

  if (!idea) {
    notFound();
  }

  const [tags, ideaTags] = await Promise.all([
    listTags(),
    listIdeaTags(idea.id),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={`/ideas/${idea.slug}`}
          >
            <ExternalLink data-icon="inline-start" />
            View Public Page
          </Link>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/ideas", label: "Ideas" },
          { label: "Edit Idea" },
        ]}
        description="Edit the trading idea, publishing state, safe preview, full research content, and risk disclosures."
        eyebrow="Trading Ideas"
        title={`Edit ${idea.ticker}`}
      />

      <div className="flex flex-wrap gap-2">
        <Badge tone="gold">{idea.ticker}</Badge>
        <Badge tone="muted">{formatVisibilityLabel(idea.visibility)}</Badge>
        <Badge tone={idea.published ? "positive" : "muted"}>
          {idea.published ? "Published" : "Draft"}
        </Badge>
      </div>

      <LifecyclePanel idea={idea} />
      <EditIdeaForm idea={idea} />
      <IdeaTagSelector
        ideaId={idea.id}
        selectedTagIds={ideaTags.map((ideaTag) => ideaTag.tag_id)}
        tags={tags}
      />
    </div>
  );
}
