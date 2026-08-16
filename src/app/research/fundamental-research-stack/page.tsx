import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Layers3, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { LockedContentPanel } from "@/components/content/locked-content-panel";
import { ResearchSectionTabs } from "@/components/content/research-section-tabs";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import {
  canAccessVisibility,
  getCurrentTier,
  getCurrentUser,
} from "@/lib/content/access";
import { fundamentalResearchStackFiles } from "@/lib/content/fundamental-research-stack";
import { getPublicMetadataUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const description =
  "A Premium research prompt library for structured company fundamentals, valuation, earnings, growth, and peer analysis.";

export const metadata: Metadata = {
  alternates: { canonical: "/research/fundamental-research-stack" },
  description,
  openGraph: {
    description,
    title: "Fundamental Research Stack",
    type: "website",
    url: getPublicMetadataUrl("/research/fundamental-research-stack"),
  },
  title: "Fundamental Research Stack",
};

export const dynamic = "force-dynamic";

export default async function FundamentalResearchStackPage() {
  const [user, tier] = await Promise.all([getCurrentUser(), getCurrentTier()]);
  const canDownload = Boolean(user) && canAccessVisibility("premium", tier);

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={
              canDownload
                ? undefined
                : [
                    {
                      href: user ? "/pricing" : "/login",
                      label: user ? "View Premium access" : "Sign in",
                    },
                  ]
            }
            description="A structured collection of reusable prompts for company fundamentals, filings, earnings quality, valuation, growth, catalysts, risk, and sector-peer comparison. Full files are reserved for Premium and Pro members."
            eyebrow="Premium research resource"
            title="Fundamental Research Stack"
          />
        </Container>
      </section>

      <section className="border-b border-border bg-surface/24 py-4">
        <Container>
          <ResearchSectionTabs active="stacks" />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <div className="grid gap-5 md:grid-cols-3">
            <StackFeature
              description="Move from business overview through financial quality, valuation, catalysts, risks, and decision-ready synthesis."
              icon={Layers3}
              title="Repeatable workflow"
            />
            <StackFeature
              description="Extend the core process with trailing and forward P/E, EPS trends, PEG interpretation, and alternative valuation metrics."
              icon={FileText}
              title="Valuation depth"
            />
            <StackFeature
              description="Require current sources, distinguish facts from interpretation, and avoid invented financial figures."
              icon={ShieldCheck}
              title="Research guardrails"
            />
          </div>

          {canDownload ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {fundamentalResearchStackFiles.map((file) => (
                <CardShell
                  className="flex h-full flex-col gap-5"
                  key={file.id}
                  padding="lg"
                  tone="elevated"
                >
                  <div className="flex items-center justify-between gap-3">
                    <FileText className="size-6 text-primary" aria-hidden />
                    <Badge tone="gold">Premium file</Badge>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {file.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {file.description}
                    </p>
                  </div>
                  <Link
                    className={cn(buttonVariants(), "mt-auto")}
                    href={`/api/research/fundamental-stack/${file.id}`}
                  >
                    <Download data-icon="inline-start" />
                    Download TXT
                  </Link>
                </CardShell>
              ))}
            </div>
          ) : (
            <LockedContentPanel
              ctaHref={user ? "/pricing" : "/login"}
              ctaLabel={user ? "View Premium access" : "Sign in"}
              description="The three Fundamental Research Stack files are available to active Premium and Pro members. This public page exposes descriptions only; the prompt files remain protected by server-side subscription checks."
              title="Unlock the Fundamental Research Stack"
              visibility="premium"
            />
          )}

          <CardShell padding="md" tone="subtle">
            <p className="text-sm leading-6 text-muted-foreground">
              Educational research workflow only. Verify current filings,
              earnings releases, estimates, and market data independently. The
              stack does not provide personalized financial advice or guarantee
              the accuracy or outcome of any analysis.
            </p>
          </CardShell>
        </Container>
      </section>
    </main>
  );
}

function StackFeature({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof FileText;
  title: string;
}) {
  return (
    <div className="flex gap-4 border-t border-border pt-5">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
