import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Download,
  ShieldCheck,
} from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { ContentFilterBar } from "@/components/content/content-filter-bar";
import { EmptyState } from "@/components/content/empty-state";
import { ResearchPostCard } from "@/components/content/research-post-card";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import {
  buildContentPageHref,
  contentVisibilityValues,
  DEFAULT_CONTENT_PAGE_SIZE,
  getContentPageSize,
  parseEnumSearchParam,
  parsePageSearchParam,
  parseSearchQuery,
} from "@/lib/content/search-params";
import { getPostPreviews } from "@/lib/content/posts";
import type { PostPreview } from "@/lib/content/types";
import { getPublicMetadataUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const pageDescription =
  "Market commentary, educational notes, and risk-aware trading research.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/research",
  },
  description: pageDescription,
  openGraph: {
    description: pageDescription,
    title: "Research",
    type: "website",
    url: getPublicMetadataUrl("/research"),
  },
  title: "Research",
};

export const dynamic = "force-dynamic";

type ResearchSearchParams = {
  page?: string | string[];
  q?: string | string[];
  visibility?: string | string[];
};

type ResearchPageProps = {
  searchParams?: Promise<ResearchSearchParams>;
};

export default async function ResearchPage({ searchParams }: ResearchPageProps) {
  const params = (await searchParams) ?? {};
  const query = parseSearchQuery(params.q);
  const visibility = parseEnumSearchParam(
    params.visibility,
    contentVisibilityValues
  );
  const page = parsePageSearchParam(params.page);
  const pageSize = getContentPageSize(DEFAULT_CONTENT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  let loadError = false;
  let previewRows: PostPreview[] = [];

  try {
    previewRows = await getPostPreviews({
      limit: pageSize + 1,
      offset,
      search: query,
      visibility,
    });
  } catch {
    loadError = true;
  }

  const posts = previewRows.slice(0, pageSize);
  const hasNextPage = previewRows.length > pageSize;
  const hasPreviousPage = page > 1;

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/free", label: "View Free Research" },
              {
                href: "/pricing",
                label: "View Access Options",
                variant: "outline",
              },
            ]}
            description="Read public-safe previews of market commentary, educational notes, and structured research posts. Premium and Pro research bodies remain protected by database access rules."
            eyebrow="Research library"
            title="Research"
          />
        </Container>
      </section>

      <section className="border-b border-border bg-surface/38 py-10 sm:py-12">
        <Container className="grid gap-5 lg:grid-cols-3">
          <ResearchNote
            description="Public market notes and educational posts are available for independent review."
            title="Market commentary"
          />
          <ResearchNote
            description="Premium research previews show safe excerpts only until member access is available."
            title="Educational notes"
          />
          <ResearchNote
            description="Pro previews summarize the research category without exposing full body content."
            title="Risk-aware research"
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <CardShell padding="lg" tone="elevated">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-3">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Free downloadable guide
                </p>
                <h2 className="text-2xl font-semibold text-foreground">
                  Trader&apos;s Risk Management Framework
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  A 15-page educational playbook covering stop-first position
                  sizing, R-multiples, drawdown control, portfolio heat,
                  correlated exposure, trading kill switches, review templates,
                  and a practical 30-day improvement plan.
                </p>
              </div>
              <Link
                className={cn(buttonVariants({ size: "lg" }))}
                href="/research/trader-risk-management-framework"
              >
                View guide
                <Download data-icon="inline-end" />
              </Link>
            </div>
          </CardShell>

          <ContentFilterBar
            action="/research"
            search={query}
            searchPlaceholder="Search market notes or education"
            showIdeaFilters={false}
            visibility={visibility}
          />

          {posts.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {posts.map((post) => (
                <ResearchPostCard
                  key={post.id}
                  lockedCtaHref="/pricing"
                  lockedCtaLabel="View access options"
                  {...post}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              actionLabel="Clear filters"
              actionHref="/research"
              description={
                loadError
                  ? "Research previews are temporarily unavailable. Please try again later."
                  : "No results found. Try changing filters."
              }
              title={
                loadError
                  ? "Research previews unavailable"
                  : "No results found."
              }
            />
          )}

          {(hasPreviousPage || hasNextPage) && (
            <nav
              aria-label="Research pagination"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-muted-foreground">
                Current page: {page}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {hasPreviousPage ? (
                  <Link
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" })
                    )}
                    href={buildContentPageHref({
                      basePath: "/research",
                      page: page - 1,
                      query,
                      visibility,
                    })}
                  >
                    <ArrowLeft data-icon="inline-start" />
                    Previous
                  </Link>
                ) : null}
                {hasNextPage ? (
                  <Link
                    className={cn(buttonVariants({ size: "lg" }))}
                    href={buildContentPageHref({
                      basePath: "/research",
                      page: page + 1,
                      query,
                      visibility,
                    })}
                  >
                    Next
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                ) : null}
              </div>
            </nav>
          )}
        </Container>
      </section>
    </main>
  );
}

function ResearchNote({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <CardShell className="h-full" padding="md">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
          {title === "Market commentary" ? (
            <BookOpenCheck aria-hidden />
          ) : (
            <ShieldCheck aria-hidden />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </CardShell>
  );
}
