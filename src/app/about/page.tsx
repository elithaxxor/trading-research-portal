import type { Metadata } from "next";
import {
  Archive,
  BellDot,
  BookOpenText,
  FileClock,
  FileText,
  LineChart,
  ListChecks,
  MessageSquareText,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { CTASection } from "@/components/cta-section";
import { FeatureGrid } from "@/components/feature-grid";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: {
    canonical: "/about",
  },
  description:
    "Learn the mission, research philosophy, and risk-aware process behind the Trading Research Portal.",
  openGraph: {
    description:
      "Learn the mission, research philosophy, and risk-aware process behind the Trading Research Portal.",
    title: "About",
    url: "/about",
  },
  title: "About",
};

const missionPoints = [
  {
    label: "Ticker",
    description: "Research starts with the instrument being studied.",
  },
  {
    label: "Status",
    description: "Ideas can move from watching to active, updated, or closed.",
  },
  {
    label: "Timeframe",
    description: "Each setup should be framed around the intended review window.",
  },
  {
    label: "Risk",
    description: "Every thesis needs clear risk context before action is considered.",
  },
  {
    label: "Updates",
    description: "A durable update history helps readers see how the thesis changed.",
  },
];

const philosophyItems = [
  {
    title: "Risk first",
    description:
      "Research should identify what can go wrong before focusing on what may go right.",
    icon: ShieldAlert,
  },
  {
    title: "Thesis before trade",
    description:
      "A setup should have a reasoned market thesis before any entry, target, or timing discussion.",
    icon: BookOpenText,
  },
  {
    title: "Invalidation matters",
    description:
      "Every idea should define what would challenge or disprove the original thesis.",
    icon: LineChart,
  },
  {
    title: "Updates should be timestamped",
    description:
      "Research is more useful when changes, context, and status updates are easy to revisit.",
    icon: FileClock,
  },
  {
    title: "Closed ideas should be reviewed",
    description:
      "Losses, invalidations, and changed conditions should be studied as part of the process.",
    icon: Archive,
  },
  {
    title: "No performance promises",
    description:
      "The portal is built for educational research, not pressure or unrealistic claims.",
    icon: SlidersHorizontal,
  },
];

const differenceItems = [
  {
    title: "More durable than chat rooms",
    description:
      "Ideas should not disappear into fast-moving threads. A portal can preserve thesis, status, risk notes, and updates in one place.",
    icon: MessageSquareText,
  },
  {
    title: "More navigable than archives",
    description:
      "Research should be easy to scan by topic, ticker, timeframe, status, and review stage instead of being buried by date.",
    icon: FileText,
  },
  {
    title: "Calmer than social posts",
    description:
      "The focus is structured research and educational context, not short-form reactions or attention-driven commentary.",
    icon: BellDot,
  },
  {
    title: "Clearer than one-off trade calls",
    description:
      "The product direction emphasizes thesis, invalidation, updates, and outcome review rather than isolated trade calls.",
    icon: ListChecks,
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="The platform is designed to organize trading ideas, charts, watchlists, and updates in a more professional way than scattered chats or newsletter archives."
            eyebrow="About the portal"
            title="Built for clear, risk-aware market research"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <SectionHeading
            eyebrow="Mission"
            title="Help members study market setups with structure and context."
            description="The portal exists to make research easier to review. Ideas can be organized by ticker, status, timeframe, risk, and update history so the focus stays on education, clarity, and process."
          />

          <CardShell className="relative overflow-hidden" padding="lg" tone="elevated">
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="grid gap-4 sm:grid-cols-2">
              {missionPoints.map((point) => (
                <div
                  className="rounded-lg border border-border bg-secondary/28 p-4"
                  key={point.label}
                >
                  <Badge tone="muted">{point.label}</Badge>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </CardShell>
        </Container>
      </section>

      <section className="border-y border-border bg-surface/38 py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Research philosophy"
            title="A repeatable process matters more than prediction."
            description="The portal is being shaped around research habits that make uncertainty visible: define the thesis, identify invalidation, document changes, and review what happened."
          />
          <FeatureGrid items={philosophyItems} />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Why a portal"
            title="A cleaner home for research than scattered market commentary."
            description="The goal is to reduce noise by giving each idea a durable record with thesis, risk, updates, and review context."
          />
          <FeatureGrid columns={2} items={differenceItems} />
        </Container>
      </section>

      <section className="border-y border-border bg-surface/38 py-16 sm:py-20">
        <Container>
          <CTASection
            className="py-0"
            description="Read the full risk language before relying on any public or premium research. The content is educational and does not promise trading results."
            headline="Market research should be read with risk in view."
            primaryCta={{ href: "/disclaimer", label: "Read Full Disclaimer" }}
          />
        </Container>
      </section>

      <Container>
        <CTASection
          description="Start with public market notes, then compare the planned premium structure for active ideas, watchlists, chart breakdowns, and update logs."
          headline="Explore the research model before member features arrive."
          primaryCta={{ href: "/free", label: "View Free Research" }}
          secondaryCta={{ href: "/pricing", label: "See Pricing" }}
        />
      </Container>
    </main>
  );
}
