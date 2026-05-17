import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { getAdminIdeaById } from "@/lib/admin/ideas";
import { listIdeaUpdates } from "@/lib/admin/updates";
import { requireAdmin } from "@/lib/auth/admin";
import {
  formatIdeaStatus,
  formatVisibilityLabel,
} from "@/lib/content/format";
import { cn } from "@/lib/utils";

import { IdeaUpdatesManager } from "./idea-updates-manager";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/ideas/updates",
  },
  description: "Admin-only trading idea update-log management workspace.",
  title: "Manage Idea Updates",
};

export const dynamic = "force-dynamic";

type AdminIdeaUpdatesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminIdeaUpdatesPage({
  params,
}: AdminIdeaUpdatesPageProps) {
  await requireAdmin("/admin/ideas");

  const { id } = await params;
  const [idea, updates] = await Promise.all([
    getAdminIdeaById(id),
    listIdeaUpdates(id),
  ]);

  if (!idea) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              href="/admin/ideas"
            >
              <ArrowLeft data-icon="inline-start" />
              Back to Ideas
            </Link>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              href={`/ideas/${idea.slug}`}
            >
              <ExternalLink data-icon="inline-start" />
              View Public Page
            </Link>
          </>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/ideas", label: "Ideas" },
          { href: `/admin/ideas/${idea.id}/edit`, label: "Edit Idea" },
          { label: "Updates" },
        ]}
        description="Add, edit, and remove timestamped update-log entries for this trading idea. Email alerts come in a later phase."
        eyebrow="Idea Updates"
        title="Manage idea updates"
      />

      <CardShell padding="lg" tone="elevated">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">{idea.ticker}</Badge>
              <Badge tone="muted">{formatVisibilityLabel(idea.visibility)}</Badge>
              <Badge tone={idea.published ? "positive" : "muted"}>
                {idea.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {idea.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current status: {formatIdeaStatus(idea.status)}
              </p>
            </div>
          </div>
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={`/admin/ideas/${idea.id}/edit`}
          >
            Edit Idea
          </Link>
        </div>
      </CardShell>

      <IdeaUpdatesManager idea={idea} updates={updates} />
    </div>
  );
}
