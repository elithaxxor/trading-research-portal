import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { listIdeaCharts } from "@/lib/admin/charts";
import { getAdminIdeaById } from "@/lib/admin/ideas";
import { requireAdmin } from "@/lib/auth/admin";
import {
  formatIdeaStatus,
  formatVisibilityLabel,
} from "@/lib/content/format";
import { cn } from "@/lib/utils";

import { IdeaChartsManager } from "./idea-charts-manager";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/ideas/charts",
  },
  description: "Admin-only trading idea chart metadata workspace.",
  title: "Manage Idea Charts",
};

export const dynamic = "force-dynamic";

type AdminIdeaChartsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminIdeaChartsPage({
  params,
}: AdminIdeaChartsPageProps) {
  await requireAdmin("/admin/ideas");

  const { id } = await params;
  const [idea, charts] = await Promise.all([
    getAdminIdeaById(id),
    listIdeaCharts(id),
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
          { label: "Charts" },
        ]}
        description="Add, edit, preview, and remove chart metadata for this trading idea."
        eyebrow="Chart Metadata"
        title="Manage idea charts"
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

      <IdeaChartsManager charts={charts} idea={idea} />
    </div>
  );
}
