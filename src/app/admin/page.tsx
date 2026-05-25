import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  FilePlus2,
  FileText,
  FolderKanban,
  Newspaper,
  Plus,
  Tags,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminIdeas } from "@/lib/admin/ideas";
import { listAdminPosts } from "@/lib/admin/posts";
import { getAdminOverviewStats } from "@/lib/admin/stats";
import type { AdminOverviewStats } from "@/lib/admin/types";
import {
  formatDate,
  formatIdeaStatus,
  formatVisibilityLabel,
} from "@/lib/content/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin",
  },
  description:
    "Admin-only content management workspace for Trading Research Portal.",
  openGraph: {
    description:
      "Admin-only content management workspace for Trading Research Portal.",
    title: "Admin",
    url: "/admin",
  },
  title: "Admin",
};

export const dynamic = "force-dynamic";

type AdminOverviewStatKey = Exclude<keyof AdminOverviewStats, "latestUpdates">;

const statCards: {
  description: string;
  icon: typeof FolderKanban;
  key: AdminOverviewStatKey;
  label: string;
}[] = [
  {
    description:
      "All trading idea records visible to admin users.",
    icon: FolderKanban,
    key: "totalIdeas",
    label: "Total trading ideas",
  },
  {
    description:
      "Trading ideas currently published for their allowed audience.",
    icon: BarChart3,
    key: "publishedIdeas",
    label: "Published trading ideas",
  },
  {
    description:
      "Trading ideas held back from public or member-facing pages.",
    icon: FileText,
    key: "draftIdeas",
    label: "Draft trading ideas",
  },
  {
    description: "All research post records visible to admin users.",
    icon: Newspaper,
    key: "totalPosts",
    label: "Total research posts",
  },
  {
    description:
      "Research posts currently published for their allowed audience.",
    icon: FilePlus2,
    key: "publishedPosts",
    label: "Published research posts",
  },
  {
    description: "Taxonomy records available for future content organization.",
    icon: Tags,
    key: "totalTags",
    label: "Total tags",
  },
];

const quickActions = [
  {
    href: "/admin/ideas/new",
    icon: Plus,
    label: "Create New Idea",
  },
  {
    href: "/admin/posts/new",
    icon: FilePlus2,
    label: "Create New Post",
  },
  {
    href: "/admin/tags",
    icon: Tags,
    label: "Manage Tags",
  },
  {
    href: "/ideas",
    icon: FolderKanban,
    label: "View Public Ideas",
  },
  {
    href: "/research",
    icon: Newspaper,
    label: "View Public Research",
  },
];

const adminNotes = [
  "Stripe billing is implemented for test-mode QA; live billing remains disabled until approval.",
  "Premium/pro visibility is enforced by server/RLS checks and webhook-driven subscription sync.",
  "TradingView chart display is available where configured; invite-only software access remains manual.",
];

function getStatValue(
  stats: Awaited<ReturnType<typeof getAdminOverviewStats>>,
  key: AdminOverviewStatKey
) {
  return String(stats[key]);
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary/25 p-5 text-sm leading-6 text-muted-foreground">
      No {label} found yet.
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin("/admin");

  const [stats, latestIdeas, latestPosts] = await Promise.all([
    getAdminOverviewStats(),
    listAdminIdeas({ limit: 5 }),
    listAdminPosts({ limit: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href="/admin/ideas/new"
          >
            <Plus data-icon="inline-start" />
            Create New Idea
          </Link>
        }
        breadcrumbs={[{ label: "Admin" }]}
        description="A protected admin snapshot for content status, publishing readiness, recent changes, and next-step management actions."
        title="Admin overview"
      />

      <section
        aria-label="Content status"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {statCards.map((card) => (
          <AdminStatCard
            description={card.description}
            icon={card.icon}
            key={card.key}
            label={card.label}
            value={getStatValue(stats, card.key)}
          />
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <CardShell padding="lg" tone="elevated">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Quick actions
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Jump into the protected admin areas or review public content
                exactly as visitors and members see it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "justify-start"
                    )}
                    href={action.href}
                    key={action.href}
                  >
                    <Icon data-icon="inline-start" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </CardShell>

        <CardShell padding="lg" tone="subtle">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-md border border-gold-400/25 bg-gold-400/10 text-gold-300">
                <AlertTriangle aria-hidden="true" className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Operating notes
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  These notes keep the admin workspace aligned with the current
                  build scope.
                </p>
              </div>
            </div>
            <ul className="grid gap-3">
              {adminNotes.map((note) => (
                <li
                  className="rounded-lg border border-border bg-background/60 p-3 text-sm leading-6 text-muted-foreground"
                  key={note}
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </CardShell>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <CardShell padding="lg" tone="elevated">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Latest trading ideas
              </h2>
              <p className="text-sm text-muted-foreground">
                Most recently updated idea records.
              </p>
            </div>
            {latestIdeas.items.length > 0 ? (
              <div className="flex flex-col gap-3">
                {latestIdeas.items.map((idea) => (
                  <Link
                    className="rounded-lg border border-border bg-background/60 p-4 transition hover:border-gold-400/35 hover:bg-gold-400/10"
                    href={`/admin/ideas`}
                    key={idea.id}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="gold">{idea.ticker}</Badge>
                        <Badge tone="muted">
                          {formatVisibilityLabel(idea.visibility)}
                        </Badge>
                        <Badge tone="default">
                          {idea.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                          {idea.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatIdeaStatus(idea.status)} | Updated{" "}
                          {formatDate(idea.updated_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyList label="trading ideas" />
            )}
          </div>
        </CardShell>

        <CardShell padding="lg" tone="elevated">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Latest research posts
              </h2>
              <p className="text-sm text-muted-foreground">
                Most recently updated research records.
              </p>
            </div>
            {latestPosts.items.length > 0 ? (
              <div className="flex flex-col gap-3">
                {latestPosts.items.map((post) => (
                  <Link
                    className="rounded-lg border border-border bg-background/60 p-4 transition hover:border-gold-400/35 hover:bg-gold-400/10"
                    href={`/admin/posts`}
                    key={post.id}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="muted">
                          {formatVisibilityLabel(post.visibility)}
                        </Badge>
                        <Badge tone="default">
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                          {post.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Updated {formatDate(post.updated_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyList label="research posts" />
            )}
          </div>
        </CardShell>

        <CardShell padding="lg" tone="elevated">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Latest idea updates
              </h2>
              <p className="text-sm text-muted-foreground">
                Recent update log entries across trading ideas.
              </p>
            </div>
            {stats.latestUpdates.length > 0 ? (
              <div className="flex flex-col gap-3">
                {stats.latestUpdates.map((update) => (
                  <div
                    className="rounded-lg border border-border bg-background/60 p-4"
                    key={update.id}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {update.status_after_update ? (
                          <Badge tone="muted">
                            {formatIdeaStatus(update.status_after_update)}
                          </Badge>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(update.created_at)}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                        {update.title}
                      </h3>
                      {update.body ? (
                        <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
                          {update.body}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyList label="idea updates" />
            )}
          </div>
        </CardShell>
      </section>
    </div>
  );
}
