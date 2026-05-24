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
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartFallback } from "@/components/charts/ChartFallback";
import { Container } from "@/components/container";
import { AssetClassBadge } from "@/components/content/asset-class-badge";
import { BiasBadge } from "@/components/content/bias-badge";
import { FollowTickerPanel } from "@/components/content/follow-ticker-panel";
import { IdeaLifecycleSummary } from "@/components/content/IdeaLifecycleSummary";
import { IdeaOutcomeReview } from "@/components/content/IdeaOutcomeReview";
import { IdeaStatusBadge } from "@/components/content/idea-status-badge";
import { IdeaTimeline } from "@/components/content/IdeaTimeline";
import { LockedContentPanel } from "@/components/content/locked-content-panel";
import { RiskBadge } from "@/components/content/risk-badge";
import { SaveIdeaPanel } from "@/components/content/save-idea-panel";
import { VisibilityBadge } from "@/components/content/visibility-badge";
import { MemberActionNotice } from "@/components/member-action-notice";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { getIdeaPageData } from "@/lib/content/ideas";
import {
  formatBias,
  formatDate,
  formatIdeaStatus,
  formatRiskLevel,
  formatVisibilityLabel,
} from "@/lib/content/format";
import type {
  IdeaDetail,
  IdeaFullContent,
  IdeaPreview,
} from "@/lib/content/types";
import { recordOpsEventSafely } from "@/lib/ops/events";
import { getPublicMetadataUrl, getSafeMetadataDescription } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type IdeaDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

const getCachedIdeaPageData = cache(async (slug: string) => {
  try {
    return await getIdeaPageData(slug);
  } catch {
    return null;
  }
});

const genericDescription =
  "Risk-aware trading research preview from Trading Research Portal.";

type IdeaSaveState = {
  isAuthenticated: boolean;
  isSaved: boolean;
  note: string | null;
};

type TickerFollowState = {
  isAuthenticated: boolean;
  isFollowed: boolean;
  note: string | null;
};

function getMetadataDescription(
  data: Awaited<ReturnType<typeof getCachedIdeaPageData>>
) {
  if (!data || data.kind === "not_found") {
    return genericDescription;
  }

  if (data.kind === "locked") {
    return getSafeMetadataDescription(data.preview.public_preview, genericDescription);
  }

  return getSafeMetadataDescription(data.idea.public_preview, genericDescription);
}

export async function generateMetadata({
  params,
}: IdeaDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedIdeaPageData(slug);

  if (!data || data.kind === "not_found") {
    return {
      description: genericDescription,
      openGraph: {
        description: genericDescription,
        title: "Trading Idea",
        type: "article",
        url: getPublicMetadataUrl(`/ideas/${slug}`),
      },
      title: "Trading Idea",
    };
  }

  const title = data.kind === "locked" ? data.preview.title : data.idea.title;
  const description = getMetadataDescription(data);
  const publishedTime =
    data.kind === "locked" ? data.preview.published_at : data.idea.published_at;
  const modifiedTime =
    data.kind === "locked" ? data.preview.updated_at : data.idea.updated_at;

  return {
    alternates: {
      canonical: `/ideas/${slug}`,
    },
    description,
    openGraph: {
      description,
      modifiedTime: modifiedTime ?? undefined,
      publishedTime: publishedTime ?? undefined,
      title,
      type: "article",
      url: getPublicMetadataUrl(`/ideas/${slug}`),
    },
    title,
  };
}

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
  searchParams,
}: IdeaDetailPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const data = await getCachedIdeaPageData(slug);

  if (!data) {
    return <UnavailablePage />;
  }

  if (data.kind === "not_found") {
    notFound();
  }

  if (data.kind === "locked") {
    const [saveState, tickerFollowState] = await Promise.all([
      getIdeaSaveState(data.preview.id),
      getTickerFollowState(data.preview.ticker),
    ]);
    await recordIdeaViewEvent({
      accessState: "locked",
      ideaId: data.preview.id,
      slug,
      status: data.preview.status,
      visibility: data.preview.visibility,
    });

    return (
      <LockedIdeaPage
        notice={search?.notice}
        preview={data.preview}
        saveState={saveState}
        tickerFollowState={tickerFollowState}
      />
    );
  }

  const [saveState, tickerFollowState] = await Promise.all([
    getIdeaSaveState(data.idea.id),
    getTickerFollowState(data.idea.ticker),
  ]);
  await recordIdeaViewEvent({
    accessState: "full",
    ideaId: data.idea.id,
    slug,
    status: data.idea.status,
    visibility: data.idea.visibility,
  });

  return (
    <FullIdeaPage
      {...data}
      notice={search?.notice}
      saveState={saveState}
      tickerFollowState={tickerFollowState}
    />
  );
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

async function recordIdeaViewEvent({
  accessState,
  ideaId,
  slug,
  status,
  visibility,
}: {
  accessState: "full" | "locked";
  ideaId: string;
  slug: string;
  status: string;
  visibility: string;
}) {
  await recordOpsEventSafely({
    entityId: ideaId,
    entityType: "trading_idea",
    eventName: "idea_viewed",
    metadata: {
      access_state: accessState,
      status,
      visibility,
    },
    route: `/ideas/${slug}`,
    source: "server",
    userId: await getCurrentUserIdForOpsView(),
  });
}

async function getIdeaSaveState(ideaId: string): Promise<IdeaSaveState> {
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    return {
      isAuthenticated: false,
      isSaved: false,
      note: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAuthenticated: false,
      isSaved: false,
      note: null,
    };
  }

  const { data, error } = await supabase
    .from("saved_ideas")
    .select("note")
    .eq("user_id", user.id)
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (error) {
    return {
      isAuthenticated: true,
      isSaved: false,
      note: null,
    };
  }

  return {
    isAuthenticated: true,
    isSaved: Boolean(data),
    note: data?.note ?? null,
  };
}

async function getTickerFollowState(ticker: string): Promise<TickerFollowState> {
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    return {
      isAuthenticated: false,
      isFollowed: false,
      note: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAuthenticated: false,
      isFollowed: false,
      note: null,
    };
  }

  const { data, error } = await supabase
    .from("followed_tickers")
    .select("note")
    .eq("user_id", user.id)
    .eq("ticker", ticker.toUpperCase())
    .maybeSingle();

  if (error) {
    return {
      isAuthenticated: true,
      isFollowed: false,
      note: null,
    };
  }

  return {
    isAuthenticated: true,
    isFollowed: Boolean(data),
    note: data?.note ?? null,
  };
}

function LockedIdeaPage({
  notice,
  preview,
  saveState,
  tickerFollowState,
}: {
  notice?: string | string[];
  preview: IdeaPreview;
  saveState: IdeaSaveState;
  tickerFollowState: TickerFollowState;
}) {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/ideas", label: "Back to Ideas", variant: "outline" },
              { href: "/pricing", label: "View Access Options" },
            ]}
            description={
              preview.public_preview ??
              "This public-safe preview gives context without revealing protected research details."
            }
            eyebrow="Locked research preview"
            title={preview.title}
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-6 lg:grid-cols-[1fr_0.86fr]">
          <div className="lg:col-span-2">
            <MemberActionNotice notice={notice} />
          </div>
          <CardShell padding="lg" tone="elevated">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <VisibilityBadge visibility={preview.visibility} />
                <AssetClassBadge assetClass={preview.asset_class} />
                <BiasBadge bias={preview.bias} />
                <IdeaStatusBadge status={preview.status} />
                <RiskBadge riskLevel={preview.risk_level} />
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Ticker" value={preview.ticker} />
                <DetailItem
                  label="Timeframe"
                  value={preview.timeframe ?? "Review"}
                />
                <DetailItem
                  label="Setup type"
                  value={preview.setup_type ?? "Research note"}
                />
                <DetailItem
                  label="Published"
                  value={formatDate(preview.published_at)}
                />
              </dl>

              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Public preview
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {preview.public_preview ??
                    "A safe public preview is being prepared for this research item."}
                </p>
              </div>

              <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Full thesis, entry zone, invalidation, targets, update bodies,
                and chart details remain protected by member access.
              </p>
            </div>
          </CardShell>

          <aside className="flex flex-col gap-6">
            <SaveIdeaPanel
              ideaId={preview.id}
              isAuthenticated={saveState.isAuthenticated}
              isLocked
              isSaved={saveState.isSaved}
              savedNote={saveState.note}
              slug={preview.slug}
            />
            <FollowTickerPanel
              isAuthenticated={tickerFollowState.isAuthenticated}
              isFollowed={tickerFollowState.isFollowed}
              note={tickerFollowState.note}
              slug={preview.slug}
              ticker={preview.ticker}
            />
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
          </aside>
        </Container>
      </section>
    </main>
  );
}

function FullIdeaPage({
  charts,
  idea,
  notice,
  saveState,
  tickerFollowState,
  updates,
}: IdeaFullContent & {
  notice?: string | string[];
  saveState: IdeaSaveState;
  tickerFollowState: TickerFollowState;
}) {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/ideas", label: "Back to Ideas", variant: "outline" },
              { href: "/pricing", label: "View Access Options" },
              {
                href: "/disclaimer",
                label: "Read Disclaimer",
                variant: "outline",
              },
            ]}
            description={
              idea.summary ??
              idea.public_preview ??
              "Risk-aware trading research detail."
            }
            eyebrow={`${idea.ticker} research`}
            title={idea.title}
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="lg:col-span-2">
            <MemberActionNotice notice={notice} />
          </div>
          <div className="flex flex-col gap-6">
            <CardShell padding="lg" tone="elevated">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-2">
                  <VisibilityBadge visibility={idea.visibility} />
                  <AssetClassBadge assetClass={idea.asset_class} />
                  <BiasBadge bias={idea.bias} />
                  <IdeaStatusBadge status={idea.status} />
                  <RiskBadge riskLevel={idea.risk_level} />
                </div>

                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailItem label="Ticker" value={idea.ticker} />
                  <DetailItem
                    label="Asset class"
                    value={formatVisibilityFreeLabel(idea.asset_class)}
                  />
                  <DetailItem label="Bias" value={formatBias(idea.bias)} />
                  <DetailItem
                    label="Status"
                    value={formatIdeaStatus(idea.status)}
                  />
                  <DetailItem
                    label="Visibility"
                    value={formatVisibilityLabel(idea.visibility)}
                  />
                  <DetailItem
                    label="Timeframe"
                    value={idea.timeframe ?? "Not specified"}
                  />
                  <DetailItem
                    label="Setup type"
                    value={idea.setup_type ?? "Not specified"}
                  />
                  <DetailItem
                    label="Risk level"
                    value={formatRiskLevel(idea.risk_level)}
                  />
                  <DetailItem
                    label="Published"
                    value={formatDate(idea.published_at)}
                  />
                  <DetailItem
                    label="Updated"
                    value={formatDate(idea.updated_at)}
                  />
                </dl>
              </div>
            </CardShell>

            <CardShell padding="lg">
              <ArticleSection
                body={idea.summary}
                fallback="No summary has been published for this idea yet."
                title="Summary"
              />
              <ArticleSection
                body={idea.thesis}
                className="mt-8 border-t border-border pt-8"
                fallback="No thesis has been published for this idea yet."
                title="Thesis"
              />
            </CardShell>

            <CardShell padding="lg">
              <div className="flex flex-col gap-5">
                <h2 className="text-2xl font-semibold text-foreground">
                  Risk and level framework
                </h2>
                <dl className="grid gap-3">
                  <DetailItem
                    label="Entry zone"
                    value={idea.entry_zone ?? "Not specified"}
                  />
                  <DetailItem
                    label="Invalidation level"
                    value={idea.invalidation_level ?? "Not specified"}
                  />
                  <DetailItem
                    label="Target 1"
                    value={idea.target_1 ?? "Not specified"}
                  />
                  <DetailItem
                    label="Target 2"
                    value={idea.target_2 ?? "Not specified"}
                  />
                  <DetailItem
                    label="Target 3"
                    value={idea.target_3 ?? "Not specified"}
                  />
                </dl>
              </div>
            </CardShell>

            <IdeaLifecycleSummary idea={idea} />
            <IdeaOutcomeReview idea={idea} />
            <IdeaTimeline updates={updates} />

            <section className="grid gap-4" aria-labelledby="idea-charts">
              <div className="flex flex-col gap-2">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                  Chart review
                </p>
                <h2
                  className="text-2xl font-semibold text-foreground"
                  id="idea-charts"
                >
                  Charts
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Charts are for educational market research only and are not
                  trade instructions.
                </p>
              </div>

              <div className="grid gap-6">
                {charts.length > 0 ? (
                  charts.map((chart) => (
                    <ChartCard chart={chart} key={chart.id} />
                  ))
                ) : (
                  <ChartFallback
                    description="No chart has been attached to this idea yet."
                    title="No chart attached"
                  />
                )}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <SaveIdeaPanel
              ideaId={idea.id}
              isAuthenticated={saveState.isAuthenticated}
              isSaved={saveState.isSaved}
              savedNote={saveState.note}
              slug={idea.slug}
            />
            <FollowTickerPanel
              isAuthenticated={tickerFollowState.isAuthenticated}
              isFollowed={tickerFollowState.isFollowed}
              note={tickerFollowState.note}
              slug={idea.slug}
              ticker={idea.ticker}
            />
            <RiskDisclosureCard idea={idea} />
            <CardShell padding="lg">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Research links
                </h2>
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href="/ideas"
                >
                  <ArrowLeft data-icon="inline-start" />
                  Back to ideas
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

function RiskDisclosureCard({ idea }: { idea: IdeaDetail }) {
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

        <DisclosureItem
          label="Position disclosure"
          value={idea.position_disclosure}
        />
        <DisclosureItem label="Risk disclosure" value={idea.risk_disclosure} />
        <DisclosureItem
          label="Educational purpose"
          value={
            idea.educational_purpose_only
              ? "This idea is marked for educational purpose only."
              : "Educational purpose status is not marked."
          }
        />
      </div>
    </CardShell>
  );
}

function DisclosureItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/45 p-4">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">
        {value ?? "Not provided."}
      </p>
    </div>
  );
}

function ArticleSection({
  body,
  className,
  fallback,
  title,
}: {
  body: string | null;
  className?: string;
  fallback: string;
  title: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
        {body ?? fallback}
      </p>
    </section>
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
                href="/ideas"
              >
                Back to ideas
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

function formatVisibilityFreeLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
