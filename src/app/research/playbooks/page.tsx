import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpenCheck, Download } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { ResearchSectionTabs } from "@/components/content/research-section-tabs";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { tradingPlaybooks } from "@/lib/content/playbooks";
import { getPublicMetadataUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const description =
  "Free downloadable trading playbooks for risk management, cross-asset analysis, and event preparation.";

export const metadata: Metadata = {
  alternates: { canonical: "/research/playbooks" },
  description,
  openGraph: {
    description,
    title: "Trading Playbooks",
    type: "website",
    url: getPublicMetadataUrl("/research/playbooks"),
  },
  title: "Trading Playbooks",
};

export default function TradingPlaybooksPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            description="Download practical, process-focused guides for planning risk, reading cross-asset relationships, and preparing for market-structure events."
            eyebrow="Free resource library"
            title="Trading Playbooks"
          />
        </Container>
      </section>

      <section className="border-b border-border bg-surface/24 py-4">
        <Container>
          <ResearchSectionTabs active="playbooks" />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {tradingPlaybooks.map((playbook) => (
              <CardShell
                className="flex h-full flex-col overflow-hidden"
                key={playbook.slug}
                padding="none"
                tone="elevated"
              >
                <div className="relative aspect-[4/3] border-b border-border bg-secondary">
                  <Image
                    alt={`Cover of ${playbook.title}`}
                    className="object-contain"
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    src={playbook.coverPath}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-5 p-6">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-primary">
                    <BookOpenCheck aria-hidden className="size-4" />
                    {playbook.pageCount} pages · Free PDF
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">
                      {playbook.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {playbook.description}
                    </p>
                  </div>
                  <div className="mt-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <Link
                      className={cn(buttonVariants({ variant: "outline" }))}
                      href={playbook.href}
                    >
                      View guide
                    </Link>
                    <a
                      className={cn(buttonVariants())}
                      download
                      href={playbook.pdfPath}
                    >
                      <Download data-icon="inline-start" />
                      Download
                    </a>
                  </div>
                </div>
              </CardShell>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
