import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Download, FolderOpen } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { ResearchSectionTabs } from "@/components/content/research-section-tabs";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import {
  tradingTutorials,
  tutorialCategories,
} from "@/lib/content/tutorials";
import { getPublicMetadataUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const description =
  "Download categorized trading tutorials covering market structure, risk, technical analysis, options, futures, order flow, and research workflows.";

export const metadata: Metadata = {
  alternates: { canonical: "/research/tutorials" },
  description,
  openGraph: {
    description,
    title: "Trading Tutorials",
    type: "website",
    url: getPublicMetadataUrl("/research/tutorials"),
  },
  title: "Trading Tutorials",
};

export default function TradingTutorialsPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Browse practical educational guides by topic. Each tutorial is available to view or download for independent study and process development."
            eyebrow="Educational library"
            title="Trading Tutorials"
          />
        </Container>
      </section>

      <section className="border-b border-border bg-surface/24 py-4">
        <Container>
          <ResearchSectionTabs active="tutorials" />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="space-y-12">
          <div className="flex flex-wrap gap-2" aria-label="Tutorial categories">
            {tutorialCategories.map((category) => (
              <a
                className="rounded-md border border-border bg-secondary/35 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                key={category}
              >
                {category}
              </a>
            ))}
          </div>

          {tutorialCategories.map((category) => {
            const tutorials = tradingTutorials.filter(
              (tutorial) => tutorial.category === category
            );

            return (
              <section
                className="scroll-mt-28 space-y-5"
                id={category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                key={category}
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <FolderOpen aria-hidden className="size-5 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    {category}
                  </h2>
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    {tutorials.length} guides
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {tutorials.map((tutorial) => (
                    <CardShell
                      className="flex h-full flex-col gap-5"
                      key={tutorial.slug}
                      tone="elevated"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary">
                          <BookOpen aria-hidden className="size-4" />
                          PDF tutorial
                        </div>
                        <h3 className="text-lg font-semibold leading-7 text-foreground">
                          {tutorial.title}
                        </h3>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {tutorial.description}
                        </p>
                      </div>
                      <div className="mt-auto grid grid-cols-2 gap-3">
                        <Link
                          className={cn(buttonVariants({ variant: "outline" }))}
                          href={tutorial.pdfPath}
                          target="_blank"
                        >
                          View
                        </Link>
                        <a
                          className={cn(buttonVariants())}
                          download
                          href={tutorial.pdfPath}
                        >
                          <Download data-icon="inline-start" />
                          Download
                        </a>
                      </div>
                    </CardShell>
                  ))}
                </div>
              </section>
            );
          })}
        </Container>
      </section>
    </main>
  );
}
