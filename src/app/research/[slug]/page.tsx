import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  ShieldAlert,
} from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { TradingViewAdvancedChart } from "@/components/charts/TradingViewAdvancedChart";
import { Container } from "@/components/container";
import { LockedContentPanel } from "@/components/content/locked-content-panel";
import { VisibilityBadge } from "@/components/content/visibility-badge";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatVisibilityLabel } from "@/lib/content/format";
import { getPostPageData } from "@/lib/content/posts";
import type { PostDetail, PostPreview } from "@/lib/content/types";
import { recordOpsEventSafely } from "@/lib/ops/events";
import { getPublicMetadataUrl, getSafeMetadataDescription } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type ResearchDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getCachedPostPageData = cache(async (slug: string) => {
  try {
    return await getPostPageData(slug);
  } catch {
    return null;
  }
});

const genericDescription =
  "Market commentary, educational notes, and risk-aware research previews.";

function getMetadataDescription(
  data: Awaited<ReturnType<typeof getCachedPostPageData>>
) {
  if (!data || data.kind === "not_found") {
    return genericDescription;
  }

  return data.kind === "locked"
    ? getSafeMetadataDescription(data.preview.excerpt, genericDescription)
    : getSafeMetadataDescription(data.post.excerpt, genericDescription);
}

export async function generateMetadata({
  params,
}: ResearchDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedPostPageData(slug);

  if (!data || data.kind === "not_found") {
    return {
      description: genericDescription,
      openGraph: {
        description: genericDescription,
        title: "Research",
        type: "article",
        url: getPublicMetadataUrl(`/research/${slug}`),
      },
      title: "Research",
    };
  }

  const title = data.kind === "locked" ? data.preview.title : data.post.title;
  const description = getMetadataDescription(data);
  const publishedTime =
    data.kind === "locked" ? data.preview.published_at : data.post.published_at;
  const modifiedTime =
    data.kind === "locked" ? data.preview.updated_at : data.post.updated_at;

  return {
    alternates: {
      canonical: `/research/${slug}`,
    },
    description,
    openGraph: {
      description,
      modifiedTime: modifiedTime ?? undefined,
      publishedTime: publishedTime ?? undefined,
      title,
      type: "article",
      url: getPublicMetadataUrl(`/research/${slug}`),
    },
    title,
  };
}

export const dynamic = "force-dynamic";

export default async function ResearchDetailPage({
  params,
}: ResearchDetailPageProps) {
  const { slug } = await params;
  const data = await getCachedPostPageData(slug);

  if (!data) {
    return <UnavailablePage />;
  }

  if (data.kind === "not_found") {
    notFound();
  }

  if (data.kind === "locked") {
    await recordResearchViewEvent({
      accessState: "locked",
      postId: data.preview.id,
      slug,
      visibility: data.preview.visibility,
    });

    return <LockedResearchPage preview={data.preview} />;
  }

  await recordResearchViewEvent({
    accessState: "full",
    postId: data.post.id,
    slug,
    visibility: data.post.visibility,
  });

  return <FullResearchPage post={data.post} />;
}

async function getCurrentUserIdForOpsView() {
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    return null;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function recordResearchViewEvent({
  accessState,
  postId,
  slug,
  visibility,
}: {
  accessState: "full" | "locked";
  postId: string;
  slug: string;
  visibility: string;
}) {
  await recordOpsEventSafely({
    entityId: postId,
    entityType: "post",
    eventName: "research_viewed",
    metadata: {
      access_state: accessState,
      visibility,
    },
    route: `/research/${slug}`,
    source: "server",
    userId: await getCurrentUserIdForOpsView(),
  });
}

function LockedResearchPage({ preview }: { preview: PostPreview }) {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/research", label: "Back to Research", variant: "outline" },
              { href: "/pricing", label: "View Access Options" },
            ]}
            description={
              preview.excerpt ??
              "This public-safe preview gives context without exposing protected research body content."
            }
            eyebrow="Locked research preview"
            title={preview.title}
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-6 lg:grid-cols-[1fr_0.86fr]">
          <CardShell padding="lg" tone="elevated">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <VisibilityBadge visibility={preview.visibility} />
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Visibility"
                  value={formatVisibilityLabel(preview.visibility)}
                />
                <DetailItem
                  label="Published"
                  value={formatDate(preview.published_at)}
                />
                <DetailItem
                  label="Updated"
                  value={formatDate(preview.updated_at)}
                />
              </dl>

              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Public preview
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {preview.excerpt ??
                    "A safe public preview is being prepared for this research post."}
                </p>
              </div>

              <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Full research body content remains protected by member access.
              </p>
            </div>
          </CardShell>

          <LockedContentPanel
            ctaHref="/pricing"
            ctaLabel="View access options"
            description={
              preview.visibility === "pro"
                ? "This research is available to Pro members."
                : "This research is available to Premium members."
            }
            title="Full research is protected"
            visibility={preview.visibility}
          />
        </Container>
      </section>
    </main>
  );
}

function FullResearchPage({ post }: { post: PostDetail }) {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/research", label: "Back to Research", variant: "outline" },
              { href: "/pricing", label: "View Access Options" },
              {
                href: "/disclaimer",
                label: "Read Disclaimer",
                variant: "outline",
              },
            ]}
            description={
              post.excerpt ??
              "Market commentary and educational research note."
            }
            eyebrow="Research note"
            title={post.title}
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-6">
            <CardShell padding="lg" tone="elevated">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-2">
                  <VisibilityBadge visibility={post.visibility} />
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Visibility"
                    value={formatVisibilityLabel(post.visibility)}
                  />
                  <DetailItem
                    label="Published"
                    value={formatDate(post.published_at)}
                  />
                  <DetailItem
                    label="Updated"
                    value={formatDate(post.updated_at)}
                  />
                </dl>

                {post.excerpt ? (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Overview
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardShell>

            {post.chart_enabled && post.tradingview_symbol ? (
              <section
                aria-labelledby="research-chart-heading"
                className="flex flex-col gap-4"
              >
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                    Interactive market chart
                  </p>
                  <h2
                    className="mt-2 text-2xl font-semibold text-foreground"
                    id="research-chart-heading"
                  >
                    TradingView analysis workspace
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Review the configured timeframe and indicators alongside the
                    written research. Market data is supplied by TradingView.
                  </p>
                </div>
                <TradingViewAdvancedChart
                  caption={post.chart_caption}
                  height={520}
                  interval={post.chart_interval}
                  studies={post.chart_studies}
                  symbol={post.tradingview_symbol}
                />
              </section>
            ) : null}

            <CardShell padding="lg">
              <article className="flex flex-col gap-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Research body
                </h2>
                <PlainTextBody body={post.body} />
              </article>
            </CardShell>
          </div>

          <aside className="flex flex-col gap-6">
            <ResearchRiskBlock />
            <CardShell padding="lg">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Research links
                </h2>
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href="/research"
                >
                  <ArrowLeft data-icon="inline-start" />
                  Back to research
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href="/pricing"
                >
                  View access options
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href="/disclaimer"
                >
                  Read disclaimer
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </div>
            </CardShell>
          </aside>
        </Container>
      </section>
    </main>
  );
}

function PlainTextBody({ body }: { body: string | null }) {
  const paragraphs =
    body
      ?.split(/\r?\n\s*\r?\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean) ?? [];

  if (paragraphs.length === 0) {
    return (
      <p className="text-sm leading-7 text-muted-foreground">
        No body content has been published for this research note yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {paragraphs.map((paragraph, index) => (
        <p
          className="whitespace-pre-line text-sm leading-7 text-muted-foreground"
          key={`${paragraph.slice(0, 32)}-${index}`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function ResearchRiskBlock() {
  return (
    <CardShell padding="lg" tone="subtle">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
            <ShieldAlert aria-hidden />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Risk notice
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Educational research only
            </h2>
          </div>
        </div>

        <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
          <li>Educational content only.</li>
          <li>Not personalized financial advice.</li>
          <li>Trading involves risk, including possible loss of capital.</li>
          <li>No results are guaranteed.</li>
          <li>Users are responsible for their own decisions.</li>
        </ul>
      </div>
    </CardShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/28 p-4">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function UnavailablePage() {
  return (
    <main className="flex-1">
      <Container className="py-16 sm:py-20">
        <CardShell padding="lg" tone="elevated">
          <div className="flex flex-col gap-5">
            <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
              <BookOpenCheck aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                Research temporarily unavailable
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                This research page could not be loaded right now. If you are
                running locally, confirm Supabase environment variables are set
                for content routes.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className={cn(buttonVariants({ size: "lg" }))}
                href="/research"
              >
                Back to research
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" })
                )}
                href="/disclaimer"
              >
                Read disclaimer
              </Link>
            </div>
          </div>
        </CardShell>
      </Container>
    </main>
  );
}
