import type { Metadata } from "next";
import Link from "next/link";
import { Code2, FileArchive, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { listImportedPineScripts } from "@/lib/software/imported-pinescripts";
import { listPublicPineScriptCatalog } from "@/lib/software/pinescripts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description: "Browse the Indicators library and its membership access options.",
  title: "Indicators",
};

export const dynamic = "force-dynamic";

export default async function PineScriptCatalogPage() {
  const [scripts, importedScripts] = await Promise.all([
    listPublicPineScriptCatalog().catch(() => []),
    listImportedPineScripts().catch(() => []),
  ]);

  return (
    <main className="flex-1">
      <section className="border-b border-border">
        <Container>
          <PageHero
            actions={[
              { href: "/pricing", label: "View membership" },
              { href: "/login?redirectedFrom=%2Fdashboard%2Fpinescripts", label: "Member sign in", variant: "outline" },
            ]}
            description="Premium and Pro memberships include every published Pine Script in this library. Individual purchase options for free accounts will be added after pricing is finalized."
            eyebrow="Member script library"
            title="Indicators"
          />
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-6">
          <CardShell className="border-primary/30 bg-primary/6" padding="md">
            <div className="flex items-start gap-4">
              <LockKeyhole className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">Protected member delivery</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Script files are delivered only after a server-side membership check. Free-user individual pricing and checkout are not active yet.
                </p>
              </div>
            </div>
          </CardShell>

          {scripts.length || importedScripts.length ? (
            <div className="grid gap-10">
              {scripts.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {scripts.map((script) => (
                    <CardShell className="flex h-full flex-col gap-5" key={script.id} padding="md" tone="elevated">
                      <div className="flex items-center justify-between gap-3">
                        <Badge tone="gold">Premium + Pro</Badge>
                        <Code2 className="size-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{script.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {script.short_description ?? "Member Pine Script documentation and protected access."}
                        </p>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                        <span className="text-muted-foreground">{script.version ?? "Current version"}</span>
                        <span className="font-medium text-primary">
                          {script.individual_purchase_enabled ? "Pricing coming soon" : "Included with membership"}
                        </span>
                      </div>
                    </CardShell>
                  ))}
                </div>
              ) : null}

              {importedScripts.length ? (
                <section aria-labelledby="imported-indicators-heading">
                  <div className="mb-5 max-w-3xl">
                    <h2 className="text-2xl font-semibold text-foreground" id="imported-indicators-heading">
                      TradingView export library
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      These protected .pine artifacts contain encrypted TradingView exports rather than readable Pine source. Synopses are based on the export labels and version names.
                    </p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {importedScripts.map((script) => (
                      <CardShell className="flex h-full flex-col gap-5" key={script.id} padding="md" tone="elevated">
                        <div className="flex items-center justify-between gap-3">
                          <Badge tone="gold">Premium + Pro</Badge>
                          <FileArchive className="size-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{script.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{script.description}</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                          <span className="text-muted-foreground">{script.version}</span>
                          <span className="font-medium text-primary">Included with membership</span>
                        </div>
                      </CardShell>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <CardShell padding="lg" tone="subtle">
              <h2 className="text-lg font-semibold text-foreground">Library coming together</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Published indicators and strategies will appear here as they are added by the administrator.
              </p>
            </CardShell>
          )}

          <Link className={cn("w-fit", buttonVariants({ size: "lg", variant: "outline" }))} href="/pricing">
            Compare Premium and Pro
          </Link>
        </Container>
      </section>
    </main>
  );
}
