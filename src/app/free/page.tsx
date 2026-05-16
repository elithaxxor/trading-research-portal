import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, Mail } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { CTASection } from "@/components/cta-section";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/free",
  },
  description:
    "Read selected public market notes, chart breakdowns, and educational trading research from the Trading Research Portal.",
  openGraph: {
    description:
      "Read selected public market notes, chart breakdowns, and educational trading research from the Trading Research Portal.",
    title: "Free Market Research",
    url: "/free",
  },
  title: "Free Market Research",
};

const featuredResearch = [
  {
    category: "Market notes",
    title: "Weekly Market Outlook",
    excerpt:
      "A public overview of index structure, sector rotation, volatility, and key risk levels for independent review.",
    date: "Public preview",
  },
  {
    category: "Chart education",
    title: "Example Chart Breakdown",
    excerpt:
      "A sample chart study showing thesis, trigger area, invalidation, and alternate scenarios.",
    date: "Public preview",
  },
  {
    category: "Risk process",
    title: "Risk Management Lesson",
    excerpt:
      "A practical note on defining invalidation before considering upside targets.",
    date: "Public preview",
  },
];

export default function FreeResearchPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/pricing", label: "Compare Access" },
              { href: "/disclaimer", label: "Read Disclaimer", variant: "outline" },
            ]}
            description="This public section will contain selected market notes, public chart breakdowns, and educational content for readers who want to evaluate the research style before any paid member features go live."
            eyebrow="Public research"
            title="Free Market Research"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Featured research"
            title="Selected public notes for market context and education."
            description="These previews show the public research structure being prepared for readers who want market context, chart education, and risk-aware process notes."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            {featuredResearch.map((item) => (
              <CardShell
                className="flex h-full flex-col gap-6"
                key={item.title}
                padding="lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <Badge tone="muted">{item.category}</Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays aria-hidden data-icon="inline-start" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.excerpt}
                  </p>
                </div>

                <button
                  className={cn(
                    "mt-auto w-full sm:w-fit",
                    buttonVariants({ variant: "outline", size: "lg" })
                  )}
                  disabled
                  type="button"
                >
                  Read preview
                  <ArrowUpRight data-icon="inline-end" />
                </button>
              </CardShell>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-surface/38 py-16 sm:py-20">
        <Container>
          <CTASection
            className="py-0"
            description="Free readers get selected public research. Early-access members are planned to receive the full active ideas dashboard, complete watchlists, premium chart breakdowns, and transparent update logs."
            headline="Move from selected public notes to a structured research dashboard."
            primaryCta={{ href: "/pricing", label: "View Planned Pricing" }}
            secondaryCta={{ href: "/register", label: "Join Early Access" }}
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <SectionHeading
            eyebrow="Early access updates"
            title="Follow along as early access is prepared."
            description="Email collection will open with the early-access launch."
          />

          <CardShell className="relative overflow-hidden" padding="lg" tone="elevated">
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <Mail aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Early access updates
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Join interest will open soon for launch updates, public
                    market notes, and educational research previews.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="free-research-email">
                  Email address
                </label>
                <input
                  className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-ring/40"
                  id="free-research-email"
                  name="email"
                  readOnly
                  type="email"
                />
                <button
                  className={cn(buttonVariants({ size: "lg" }))}
                  disabled
                  type="button"
                >
                  Opening soon
                </button>
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                This visual preview is disabled while email collection is being
                prepared for early access.
              </p>
            </div>
          </CardShell>
        </Container>
      </section>

      <Container>
        <DisclaimerBanner message="Free research is educational content only and is not financial advice. Trading involves risk, uncertainty, and possible loss. No public or premium content guarantees performance." />
      </Container>
    </main>
  );
}
