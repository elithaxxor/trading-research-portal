import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { getPublicMetadataUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const pdfPath = "/downloads/trader-risk-management-framework.pdf";
const description =
  "Download a practical educational framework for position sizing, drawdown control, portfolio heat, trading limits, and disciplined review.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/research/trader-risk-management-framework",
  },
  description,
  openGraph: {
    description,
    images: [
      {
        alt: "Trader's Risk Management Framework cover",
        url: "/images/trader-risk-management-framework-cover.png",
      },
    ],
    title: "Trader's Risk Management Framework",
    type: "article",
    url: getPublicMetadataUrl("/research/trader-risk-management-framework"),
  },
  title: "Trader's Risk Management Framework",
};

const frameworkTopics = [
  "Stop-first position sizing for cash and leveraged products",
  "R-multiples, expectancy, and drawdown recovery",
  "Portfolio heat, correlation, volatility, and liquidity risk",
  "Daily and weekly loss caps with practical kill switches",
  "Beginner, intermediate, and expert risk-management concepts",
  "Daily, weekly, and monthly review templates plus a 30-day plan",
];

export default function TraderRiskManagementFrameworkPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              {
                href: pdfPath,
                label: "Download PDF",
              },
              {
                href: "/research",
                label: "Back to Research",
                variant: "outline",
              },
            ]}
            description="A practical 15-page guide for defining risk before entry, sizing from the stop, controlling total exposure, and reviewing trading decisions consistently."
            eyebrow="Free educational guide"
            title="Trader's Risk Management Framework"
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <CardShell className="overflow-hidden" padding="none" tone="elevated">
            <div className="relative aspect-[3/4] bg-secondary">
              <Image
                alt="Cover of the Trader's Risk Management Framework PDF"
                className="object-contain"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                src="/images/trader-risk-management-framework-cover.png"
              />
            </div>
          </CardShell>

          <div className="flex flex-col gap-6">
            <CardShell padding="lg" tone="elevated">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <BookOpenCheck aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      PDF guide
                    </p>
                    <p className="font-semibold text-foreground">
                      15 pages · Beginner through expert
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  This framework turns risk management into a repeatable
                  operating process. It begins with survival and uncertainty,
                  then develops position sizing, stop placement, R-based review,
                  drawdown control, portfolio-level exposure, and behavioral
                  guardrails. The final sections provide reusable planning and
                  review templates for building more consistent habits.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    className={cn(buttonVariants({ size: "lg" }))}
                    download="Trader_Risk_Management_Framework.pdf"
                    href={pdfPath}
                  >
                    <Download data-icon="inline-start" />
                    Download PDF
                  </a>
                  <a
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" })
                    )}
                    href={pdfPath}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open in browser
                    <ExternalLink data-icon="inline-end" />
                  </a>
                </div>
              </div>
            </CardShell>

            <CardShell padding="lg">
              <h2 className="text-xl font-semibold text-foreground">
                What the guide covers
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {frameworkTopics.map((topic) => (
                  <li
                    className="flex gap-3 text-sm leading-6 text-muted-foreground"
                    key={topic}
                  >
                    <ShieldCheck
                      aria-hidden
                      className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </CardShell>

            <CardShell padding="md" tone="subtle">
              <p className="text-sm leading-6 text-muted-foreground">
                Educational use only. The percentages, limits, and examples in
                the guide are illustrative rather than universal rules. They do
                not account for every trader&apos;s objectives, costs, market,
                liquidity, or financial circumstances and are not personalized
                financial advice.
              </p>
            </CardShell>

            <Link
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "self-start"
              )}
              href="/research"
            >
              <ArrowLeft data-icon="inline-start" />
              Back to Research
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
