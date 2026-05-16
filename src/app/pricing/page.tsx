import type { Metadata } from "next";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { ComparisonTable } from "@/components/comparison-table";
import { Container } from "@/components/container";
import { CTASection } from "@/components/cta-section";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { PageHero } from "@/components/page-hero";
import { PricingCard } from "@/components/pricing-card";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: {
    canonical: "/pricing",
  },
  description:
    "Compare planned early-access options for public trading research and future member features.",
  openGraph: {
    description:
      "Compare planned early-access options for public trading research and future member features.",
    title: "Pricing",
    url: "/pricing",
  },
  title: "Pricing",
};

const plans = [
  {
    tier: "Free",
    price: "$0",
    description:
      "For readers who want occasional market commentary and selected public research.",
    features: [
      "Public market notes",
      "Selected chart breakdowns",
      "Educational posts",
      "Delayed or limited idea previews",
      "Early access updates",
    ],
    ctaHref: "/free",
    ctaLabel: "View Free Research",
  },
  {
    tier: "Premium",
    price: "Planned at $49/month",
    description:
      "For active members who want structured trading ideas, premium chart breakdowns, watchlists, and updates.",
    features: [
      "Premium trading ideas",
      "Active ideas dashboard",
      "Full watchlist",
      "Premium chart breakdowns",
      "Update logs",
      "Closed idea reviews",
      "Member-only market notes",
    ],
    ctaHref: "/register",
    ctaLabel: "Join Early Access",
    highlighted: true,
    badgeLabel: "Recommended",
  },
  {
    tier: "Pro",
    price: "Invite-only beta",
    description:
      "For members who want deeper commentary, higher-touch research, and future live sessions.",
    features: [
      "Everything in Premium",
      "Pro-only research notes",
      "Monthly strategy session planning",
      "Priority Q&A consideration",
      "Advanced watchlist planning",
    ],
    ctaHref: "/register",
    ctaLabel: "Request Pro Access",
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
    feature: "Delayed or limited idea previews",
    free: "Limited",
    premium: true,
  },
  {
    feature: "Premium trading ideas",
    free: false,
    premium: "Planned",
  },
  {
    feature: "Active ideas dashboard",
    free: false,
    premium: "Planned",
  },
  {
    feature: "Full watchlist and update logs",
    free: false,
    premium: "Planned",
  },
  {
    feature: "Closed idea reviews",
    free: false,
    premium: "Planned",
  },
];

const faqs = [
  {
    question: "Is this financial advice?",
    answer:
      "No. The site provides educational market research, commentary, watchlists, and chart-based examples for independent review.",
  },
  {
    question: "Do you guarantee results?",
    answer:
      "No plan guarantees trading results. Markets are uncertain, and every trader is responsible for their own decisions and risk.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Membership management will be made clear before paid access opens. Current pricing is planned early-access information only.",
  },
  {
    question: "What is included in Premium?",
    answer:
      "Premium is planned to include structured trading ideas, an active ideas dashboard, full watchlists, update logs, premium chart breakdowns, and closed idea reviews.",
  },
  {
    question: "Will there be alerts?",
    answer:
      "Alerts may be considered later, but the product direction is structured research and transparent updates rather than noisy trade prompts.",
  },
  {
    question: "When do payments go live?",
    answer:
      "Memberships are not open yet. Early-access updates will announce when paid access is available.",
  },
];

export default function PricingPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/free", label: "View Free Research" },
              { href: "/register", label: "Join Early Access", variant: "outline" },
            ]}
            description="Compare the planned access levels for public research, future premium dashboard access, and invite-only pro research."
            eyebrow="Planned pricing"
            title="Choose the research access level that fits how you study markets."
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard key={plan.tier} {...plan} />
            ))}
          </div>

          <CardShell
            className="border-primary/24 bg-primary/6"
            padding="md"
            tone="subtle"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <Badge tone="gold">Early access note</Badge>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Memberships are not open yet. Prices and plan details may
                  change before launch.
                </p>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Subscriptions provide educational market research only. No plan
                guarantees trading results. Trading involves risk.
              </p>
            </div>
          </CardShell>
        </Container>
      </section>

      <section className="border-y border-border bg-surface/38 py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Plan comparison"
            title="Free public research now, structured member research later."
            description="The comparison shows what public readers can access now and what is being prepared for the private member dashboard."
          />
          <ComparisonTable rows={comparisonRows} />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Pricing FAQ"
            title="Straight answers before memberships open."
            description="The goal is to make the planned research model clear without implying guaranteed results or active billing."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <CardShell key={item.question} padding="md">
                <h2 className="text-base font-semibold text-foreground">
                  {item.question}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </CardShell>
            ))}
          </div>
        </Container>
      </section>

      <Container>
        <DisclaimerBanner message="Subscriptions provide educational market research only. No plan guarantees trading results. Trading involves risk, including possible loss." />
        <CTASection
          description="Start with public market notes while the private research dashboard and early-access membership flow are prepared."
          headline="Review the research style before choosing a future plan."
          primaryCta={{ href: "/free", label: "View Free Research" }}
          secondaryCta={{ href: "/register", label: "Join Early Access" }}
        />
      </Container>
    </main>
  );
}
