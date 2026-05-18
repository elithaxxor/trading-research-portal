import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { ContentFilterBar } from "@/components/content/content-filter-bar";
import { EmptyState } from "@/components/content/empty-state";
import { IdeaCard } from "@/components/content/idea-card";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { getIdeaPreviews } from "@/lib/content/ideas";
import {
  assetClassValues,
  buildContentPageHref,
  contentVisibilityValues,
  DEFAULT_CONTENT_PAGE_SIZE,
  getContentPageSize,
  ideaOutcomeValues,
  ideaPreviewSortValues,
  ideaStatusValues,
  parseBooleanSearchParam,
  parseEnumSearchParam,
  parsePageSearchParam,
  parseSearchQuery,
} from "@/lib/content/search-params";
import type { IdeaPreview } from "@/lib/content/types";
import { getPublicMetadataUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const pageDescription =
  "Risk-aware trading idea previews, market commentary, and chart-based setup notes.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/ideas",
  },
  description: pageDescription,
  openGraph: {
    description: pageDescription,
    title: "Trading Ideas",
    type: "website",
    url: getPublicMetadataUrl("/ideas"),
  },
  title: "Trading Ideas",
};

export const dynamic = "force-dynamic";

type IdeasSearchParams = {
  asset_class?: string | string[];
  closed_reviews?: string | string[];
  outcome?: string | string[];
  page?: string | string[];
  q?: string | string[];
  sort?: string | string[];
  status?: string | string[];
  updated_recently?: string | string[];
  visibility?: string | string[];
};

type IdeasPageProps = {
  searchParams?: Promise<IdeasSearchParams>;
};

export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  const params = (await searchParams) ?? {};
  const query = parseSearchQuery(params.q);
  const assetClass = parseEnumSearchParam(params.asset_class, assetClassValues);
  const outcome = parseEnumSearchParam(params.outcome, ideaOutcomeValues);
  const sort =
    parseEnumSearchParam(params.sort, ideaPreviewSortValues) ?? "published";
  const status = parseEnumSearchParam(params.status, ideaStatusValues);
  const updatedRecently = parseBooleanSearchParam(params.updated_recently);
  const closedReviews = parseBooleanSearchParam(params.closed_reviews);
  const visibility = parseEnumSearchParam(
    params.visibility,
    contentVisibilityValues
  );
  const page = parsePageSearchParam(params.page);
  const pageSize = getContentPageSize(DEFAULT_CONTENT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  let loadError = false;
  let previewRows: IdeaPreview[] = [];

  try {
    previewRows = await getIdeaPreviews({
      assetClass,
      limit: pageSize + 1,
      offset,
      outcome,
      search: query,
      sort,
      status,
      updatedRecently,
      visibility,
      withClosedReviews: closedReviews,
    });
  } catch {
    loadError = true;
  }

  const ideas = previewRows.slice(0, pageSize);
  const hasNextPage = previewRows.length > pageSize;
  const hasPreviousPage = page > 1;

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/pricing", label: "View Access Options" },
              {
                href: "/disclaimer",
                label: "Read Risk Disclaimer",
                variant: "outline",
              },
            ]}
            description="Browse public-safe previews of risk-aware trading ideas, market setups, and chart-based research notes. Full member research remains protected by database access rules."
            eyebrow="Trading research"
            title="Trading Ideas"
          />
        </Container>
      </section>

      <section className="border-b border-border bg-surface/38 py-10 sm:py-12">
        <Container className="grid gap-5 lg:grid-cols-3">
          <AccessNote
            description="Published free ideas can be reviewed publicly for educational context."
            title="Free previews"
          />
          <AccessNote
            description="Premium previews show safe summary fields only until member access is available."
            title="Premium research"
          />
          <AccessNote
            description="Pro previews are visible as locked summaries without exposing thesis, levels, or targets."
            title="Pro research"
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <ContentFilterBar
            action="/ideas"
            asset_class={assetClass}
            closed_reviews={closedReviews}
            outcome={outcome}
            search={query}
            sort={sort}
            status={status}
            updated_recently={updatedRecently}
            visibility={visibility}
          />

          {ideas.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  lockedCtaHref="/pricing"
                  lockedCtaLabel="View access options"
                  {...idea}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              actionLabel="Clear filters"
              actionHref="/ideas"
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
              aria-label="Trading ideas pagination"
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
                      assetClass,
                      basePath: "/ideas",
                      closedReviews,
                      outcome,
                      page: page - 1,
                      query,
                      sort,
                      status,
                      updatedRecently,
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
                      assetClass,
                      basePath: "/ideas",
                      closedReviews,
                      outcome,
                      page: page + 1,
                      query,
                      sort,
                      status,
                      updatedRecently,
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

function AccessNote({
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
          <ShieldCheck aria-hidden />
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
