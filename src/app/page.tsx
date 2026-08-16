import type { Metadata } from "next";
import {
  Archive,
  BellDot,
  ExternalLink,
  FileText,
  Layers3,
  LineChart,
  ListChecks,
  MessageSquareText,
  Newspaper,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/badge";
import { AuthNotice } from "@/components/auth-notice";
import { CardShell } from "@/components/card-shell";
import { TradingViewAdvancedChart } from "@/components/charts/TradingViewAdvancedChart";
import { ComparisonTable } from "@/components/comparison-table";
import { Container } from "@/components/container";
import { CTASection } from "@/components/cta-section";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { FeatureGrid } from "@/components/feature-grid";
import { IdeaPreviewCard } from "@/components/idea-preview-card";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";

const pageTitle = "Chart-Based Trading Research";
const pageDescription =
  "Chart-based trading research, market commentary, watchlists, and risk-aware trading ideas organized in one private dashboard.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description: pageDescription,
  openGraph: {
    description: pageDescription,
    title: pageTitle,
    url: "/",
  },
  title: {
    absolute: `${pageTitle} | Trading Research Portal`,
  },
};

type HomePageProps = {
  searchParams?: Promise<{
    status?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const dashboardCards = [
  {
    label: "Active Ideas",
    value: "08",
    detail: "Risk-defined research notes under review",
  },
  {
    label: "Recently Updated",
    value: "14",
    detail: "Market notes with fresh context or status changes",
  },
  {
    label: "Watchlist",
    value: "27",
    detail: "Tickers and themes queued for chart review",
  },
  {
    label: "Closed Reviews",
    value: "19",
    detail: "Completed idea reviews for process study",
  },
];

const memberFeatures = [
  {
    title: "Active ideas dashboard",
    description:
      "A member workspace for tracking thesis, status, timeframe, risk, and updates in one place.",
    icon: Layers3,
  },
  {
    title: "Chart breakdowns",
    description:
      "Structured chart-based research with levels, scenarios, and invalidation clearly separated.",
    icon: LineChart,
  },
  {
    title: "Watchlists",
    description:
      "Curated market themes and tickers for organized review instead of scattered notes.",
    icon: ListChecks,
  },
  {
    title: "Update logs",
    description:
      "Transparent changes as conditions evolve, including status shifts and fresh context.",
    icon: BellDot,
  },
  {
    title: "Closed idea reviews",
    description:
      "Post-review notes focused on process, risk management, and what changed after publication.",
    icon: Archive,
  },
  {
    title: "Weekly market notes",
    description:
      "Broader commentary to connect individual ideas with index, sector, and macro context.",
    icon: Newspaper,
  },
];

const platformAdvantages = [
  {
    title: "Better organized than chat rooms",
    description:
      "Research can live in durable records with status, thesis, risk notes, updates, and outcomes.",
    icon: MessageSquareText,
  },
  {
    title: "More structured than newsletters",
    description:
      "Ideas can be filtered, revisited, updated, and reviewed instead of disappearing into an inbox.",
    icon: FileText,
  },
  {
    title: "Focused on clarity, not noise",
    description:
      "The product direction emphasizes a clean research archive over constant alerts or pressure.",
    icon: SlidersHorizontal,
  },
];

const workflowSteps = [
  {
    title: "Read the market note",
    description:
      "Start with broad commentary on index levels, themes, and conditions.",
  },
  {
    title: "Review the setup",
    description:
      "Open a structured idea with thesis, timeframe, risk level, and example levels.",
  },
  {
    title: "Follow transparent updates",
    description:
      "Track status changes and notes as the market confirms, rejects, or changes the original thesis.",
  },
  {
    title: "Study the review",
    description:
      "Use closed idea reviews to evaluate process, risk framing, and lessons learned.",
  },
];

const comparisonRows = [
  {
    feature: "Public market notes",
    free: true,
    premium: true,
  },
  {
    feature: "Selected chart breakdowns",
    free: true,
    premium: true,
  },
  {
    feature: "Educational posts",
    free: true,
    premium: true,
  },
  {
    feature: "Active trading ideas",
    free: false,
    premium: true,
  },
  {
    feature: "Full watchlist",
    free: "Limited",
    premium: true,
  },
  {
    feature: "Premium updates",
    free: false,
    premium: true,
  },
  {
    feature: "Idea archive",
    free: false,
    premium: true,
  },
  {
    feature: "Closed idea reviews",
    free: false,
    premium: true,
  },
];

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const status = getFirstParam(params?.status);

  return (
    <main className="flex-1">
      {status === "signed_out" ? (
        <Container className="pt-6">
          <AuthNotice
            message="You have been signed out."
            tone="success"
          />
        </Container>
      ) : null}
      <HeroSection />
      <TrustSection />
      <ProductPreviewSection />
      <ExampleIdeaSection />
      <MembersSection />
      <ComparisonSection />
      <PlatformSection />
      <HowItWorksSection />
      <Container>
        <DisclaimerBanner />
        <CTASection
          description="Explore the free research surface, create an account, or compare Premium and Pro access for the private research dashboard."
          headline="A cleaner home for trading research is taking shape."
          primaryCta={{ href: "/free", label: "View Free Research" }}
          secondaryCta={{ href: "/pricing", label: "Compare Access" }}
        />
      </Container>
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <Container className="grid gap-12 py-20 sm:py-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-28">
        <PageHero
          actions={[
            { href: "/free", label: "View Free Research" },
            { href: "/pricing", label: "Compare Access", variant: "outline" },
          ]}
          className="py-0"
          description="Market commentary, watchlists, trading ideas, chart breakdowns, and update logs designed for organized research rather than noisy alerts."
          title="Chart-based trading research, organized in one private dashboard."
        />
        <ChartPreview />
      </Container>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionHeading
          eyebrow="Risk-first positioning"
          title="Educational market research with risk management at the center."
          description="The portal is designed to clarify market context and trading scenarios. It does not promise profits, remove uncertainty, or replace independent judgment."
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard
            description="Ideas are framed with the point that would challenge or invalidate the thesis."
            label="Risk frame"
            value="Before"
          />
          <StatCard
            description="Updates can document what changed, why it changed, and what remains uncertain."
            label="Updates"
            value="Transparent"
          />
          <StatCard
            description="Content is positioned as educational research for independent review."
            label="Promise"
            value="None"
          />
        </div>
      </Container>
    </section>
  );
}

function ProductPreviewSection() {
  return (
    <section className="border-y border-border bg-surface/38 py-20 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
        <SectionHeading
          eyebrow="Product preview"
          title="A dashboard-style preview for research that needs structure."
          description="This preview shows the planned member experience: organized idea status, watchlists, update logs, and closed reviews in one place."
        />
        <DashboardPreview />
      </Container>
    </section>
  );
}

function ExampleIdeaSection() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionHeading
          eyebrow="Example research card"
          title="Pair thesis, status, timeframe, and example levels with a live chart."
          description="This educational ES futures preview shows how research context and a live TradingView chart can stay together. It is not financial advice, a recommendation, or a performance claim."
        />
        <div className="flex min-w-0 flex-col gap-6">
          <IdeaPreviewCard
            bias="Long Watch"
            levels={[
              { label: "Trigger Zone", value: "Example only" },
              { label: "Invalidation", value: "Example only" },
              { label: "Target Zones", value: "Example only" },
            ]}
            riskLevel="Medium"
            status="Watching"
            thesis="Educational preview: ES1! is used here to demonstrate how a futures research card can organize thesis, levels, chart context, and updates. This is not financial advice."
            ticker="ES1!"
            timeframe="60-minute"
          />
          <TradingViewAdvancedChart
            caption="Live SPY proxy for ES1! market-structure and educational research context. Open the exact ES1! chart below. Data availability and timing are provided by TradingView."
            height={440}
            interval="60"
            symbol="AMEX:SPY"
          />
          <a
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gold-400/35 bg-gold-400/10 px-4 py-3 text-sm font-semibold text-gold-200 transition hover:border-gold-300/60 hover:bg-gold-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-fit"
            href="https://www.tradingview.com/chart/?symbol=CME_MINI%3AES1%21"
            rel="noreferrer"
            target="_blank"
          >
            Open ES1! on TradingView
            <ExternalLink aria-hidden className="size-4" />
          </a>
        </div>
      </Container>
    </section>
  );
}

function MembersSection() {
  return (
    <section className="border-y border-border bg-surface/38 py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="What members get"
          title="A research workspace for ideas, watchlists, updates, and reviews."
          description="Premium and Pro memberships unlock deeper research workflows while keeping the experience educational and independent from broker execution."
        />
        <FeatureGrid items={memberFeatures} />
      </Container>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Free vs Premium"
          title="Public research and deeper member workflows."
          description="Free content introduces the research style. Premium content adds active ideas, watchlists, updates, archives, and closed reviews."
        />
        <ComparisonTable rows={comparisonRows} />
      </Container>
    </section>
  );
}

function PlatformSection() {
  return (
    <section className="border-y border-border bg-surface/38 py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Why a portal"
          title="More structured than newsletters, calmer than chat rooms."
          description="A dedicated portal can preserve context around every idea instead of scattering research across chat messages or newsletter archives."
        />
        <FeatureGrid columns={3} items={platformAdvantages} />
      </Container>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <SectionHeading
          eyebrow="How it works"
          title="A simple research workflow from context to review."
          description="The product is designed around a repeatable process: market context, structured ideas, transparent updates, and post-review learning."
        />
        <div className="grid gap-4">
          {workflowSteps.map((step, index) => (
            <CardShell
              className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start"
              key={step.title}
            >
              <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </CardShell>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ChartPreview() {
  const candles = [
    { height: "42%", top: "38%", tone: "bg-positive" },
    { height: "58%", top: "26%", tone: "bg-primary" },
    { height: "36%", top: "44%", tone: "bg-caution" },
    { height: "68%", top: "18%", tone: "bg-positive" },
    { height: "48%", top: "32%", tone: "bg-primary" },
    { height: "74%", top: "14%", tone: "bg-positive" },
    { height: "54%", top: "28%", tone: "bg-primary" },
    { height: "64%", top: "20%", tone: "bg-positive" },
  ];

  return (
    <CardShell
      className="relative overflow-hidden border-primary/20 bg-card/82"
      padding="lg"
      tone="elevated"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Market structure preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Thesis, levels, and risk in view
            </h2>
          </div>
          <Badge tone="gold">Research preview</Badge>
        </div>

        <div className="relative min-h-80 overflow-hidden rounded-lg border border-border bg-background/42 p-5">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative flex h-64 items-end justify-between gap-3">
            {candles.map((candle, index) => (
              <div
                className="relative flex h-full flex-1 items-start justify-center"
                key={`${candle.height}-${index}`}
              >
                <span
                  className="absolute w-px rounded-full bg-border"
                  style={{ height: candle.height, top: candle.top }}
                />
                <span
                  className={`absolute w-full max-w-4 rounded-sm ${candle.tone}`}
                  style={{
                    height: `calc(${candle.height} / 2)`,
                    top: `calc(${candle.top} + 10%)`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="relative mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                Thesis
              </p>
              <p className="mt-2 text-foreground">Trend continuation study</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                Risk
              </p>
              <p className="mt-2 text-foreground">Invalidation defined first</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                Updates
              </p>
              <p className="mt-2 text-foreground">Context tracked over time</p>
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function DashboardPreview() {
  return (
    <CardShell
      className="relative overflow-hidden border-primary/20 bg-card/82"
      padding="lg"
      tone="elevated"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Research command center
            </h2>
          </div>
          <Badge tone="muted">Member workspace</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {dashboardCards.map((card) => (
            <div
              className="rounded-lg border border-border bg-secondary/28 p-4"
              key={card.label}
            >
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {card.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          {[
            ["SPY", "Watching", "Swing", "Risk noted"],
            ["NVDA", "Updated", "Daily", "Levels revised"],
            ["XLE", "Watchlist", "Weekly", "Theme review"],
          ].map(([ticker, status, timeframe, note]) => (
            <div
              className="grid gap-3 rounded-lg border border-border bg-background/36 p-4 text-sm sm:grid-cols-[0.55fr_0.8fr_0.7fr_1fr]"
              key={ticker}
            >
              <span className="font-semibold text-foreground">{ticker}</span>
              <span className="text-muted-foreground">{status}</span>
              <span className="text-muted-foreground">{timeframe}</span>
              <span className="text-muted-foreground">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}
