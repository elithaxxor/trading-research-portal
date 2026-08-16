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
import type { TradingPlaybook } from "@/lib/content/playbooks";
import { cn } from "@/lib/utils";

export function PlaybookResourcePage({ playbook }: { playbook: TradingPlaybook }) {
  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: playbook.pdfPath, label: "Download PDF" },
              {
                href: "/research/playbooks",
                label: "All Playbooks",
                variant: "outline",
              },
            ]}
            description={playbook.description}
            eyebrow="Free trading playbook"
            title={playbook.title}
          />
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <CardShell className="overflow-hidden" padding="none" tone="elevated">
            <div className="relative aspect-[3/4] bg-secondary">
              <Image
                alt={`Cover of the ${playbook.title} PDF`}
                className="object-contain"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                src={playbook.coverPath}
              />
            </div>
          </CardShell>

          <div className="flex flex-col gap-6">
            <CardShell padding="lg" tone="elevated">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                    <BookOpenCheck aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {playbook.eyebrow}
                    </p>
                    <p className="font-semibold text-foreground">
                      {playbook.pageCount} pages · Free PDF
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  {playbook.overview}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    className={cn(buttonVariants({ size: "lg" }))}
                    download
                    href={playbook.pdfPath}
                  >
                    <Download data-icon="inline-start" />
                    Download PDF
                  </a>
                  <a
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" })
                    )}
                    href={playbook.pdfPath}
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
                What the playbook covers
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {playbook.topics.map((topic) => (
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
                Educational use only. Examples and planning frameworks are
                illustrative, not universal rules or personalized financial,
                investment, tax, or legal advice. Verify current product rules,
                market structure, costs, liquidity, and risk before acting.
              </p>
            </CardShell>

            <Link
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "self-start"
              )}
              href="/research/playbooks"
            >
              <ArrowLeft data-icon="inline-start" />
              All Trading Playbooks
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
