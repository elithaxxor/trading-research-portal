import type { Metadata } from "next";
import {
  BadgeDollarSign,
  BookOpenText,
  ClipboardCheck,
  FileSearch,
  Scale,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: {
    canonical: "/disclaimer",
  },
  description:
    "Read the plain-English risk disclaimer for educational trading research, market commentary, and planned member content.",
  openGraph: {
    description:
      "Read the plain-English risk disclaimer for educational trading research, market commentary, and planned member content.",
    title: "Risk Disclaimer",
    url: "/disclaimer",
  },
  title: "Risk Disclaimer",
};

const disclaimerSections = [
  {
    title: "Educational purpose",
    description:
      "All commentary, watchlists, chart breakdowns, example ideas, update logs, and related content are provided for educational and informational purposes only.",
    icon: BookOpenText,
  },
  {
    title: "Not financial advice",
    description:
      "Content on this site should not be treated as personalized investment, financial, legal, or tax advice. It does not account for any individual reader's objectives, financial situation, risk tolerance, or constraints.",
    icon: Scale,
  },
  {
    title: "Trading risk",
    description:
      "Trading and investing involve risk, including possible loss of capital. Markets can move quickly, conditions can change, and any research scenario can be invalidated.",
    icon: ShieldAlert,
  },
  {
    title: "No guarantees",
    description:
      "No trading or investing results are guaranteed. Past performance, historical examples, sample outcomes, or educational case studies do not ensure future results.",
    icon: ClipboardCheck,
  },
  {
    title: "User responsibility",
    description:
      "Users are responsible for their own trading and investing decisions. Readers should do their own research, evaluate risk independently, and consult appropriate professionals when needed.",
    icon: UserCheck,
  },
  {
    title: "Position disclosures",
    description:
      "Future idea pages may include position disclosures where appropriate. Any disclosure format should be reviewed and kept current as research content evolves.",
    icon: FileSearch,
  },
  {
    title: "Subscription disclaimer",
    description:
      "Premium membership, if offered, provides access to research content only. A subscription does not guarantee profitable outcomes or remove trading risk.",
    icon: BadgeDollarSign,
  },
];

export default function DisclaimerPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Plain-English risk language for an educational trading research portal. This page is not legal advice."
            eyebrow="Plain-English risk language"
            title="Risk Disclaimer"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Important context"
            title="Research can support judgment, but it cannot remove uncertainty."
            description="The portal is designed around educational market research. Every reader should treat the content as a starting point for independent study, not as a directive to buy, sell, hold, or trade any security or instrument."
          />

          <CardShell
            className="relative overflow-hidden border-primary/24 bg-primary/6"
            padding="lg"
            tone="elevated"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <ShieldAlert aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Legal review recommended
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                    Review with qualified legal counsel before paid memberships,
                    personalized services, or live trading research are offered.
                  </p>
                </div>
              </div>
              <Badge tone="gold">Attorney review required</Badge>
            </div>
          </CardShell>
        </Container>
      </section>

      <section className="border-y border-border bg-surface/38 py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Disclaimer sections"
            title="Core risk language for public and future member content."
            description="These sections cover educational purpose, advice limitations, trading risk, guarantees, user responsibility, disclosures, and subscription expectations."
          />

          <div className="grid gap-5 md:grid-cols-2">
            {disclaimerSections.map((section) => {
              const Icon = section.icon;

              return (
                <CardShell key={section.title} padding="lg">
                  <Icon className="size-5 text-primary" aria-hidden />
                  <h2 className="mt-5 text-lg font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {section.description}
                  </p>
                </CardShell>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <CardShell padding="lg" tone="subtle">
            <div className="flex flex-col gap-4">
              <Badge tone="muted">Attorney review notice</Badge>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                Review with qualified legal counsel before paid memberships,
                personalized services, or live trading research are offered.
              </p>
            </div>
          </CardShell>
        </Container>
      </section>
    </main>
  );
}
