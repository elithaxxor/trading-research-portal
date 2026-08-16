import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Download, FileArchive } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { SoftwareLockedPanel } from "@/components/software/SoftwareLockedPanel";
import { buttonVariants } from "@/components/ui/button";
import { canAccessPineScriptLibrary, getCurrentSoftwareAccessTier } from "@/lib/software/access";
import { listImportedPineScripts } from "@/lib/software/imported-pinescripts";
import { listMemberPineScripts } from "@/lib/software/pinescripts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Indicators" };
export const dynamic = "force-dynamic";

export default async function MemberPineScriptsPage() {
  const access = await getCurrentSoftwareAccessTier();
  const canAccess = canAccessPineScriptLibrary(access.userTier, access.isAdmin);
  const [scripts, importedScripts] = canAccess
    ? await Promise.all([listMemberPineScripts(), listImportedPineScripts()])
    : [[], []];

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Indicators" }]}
        description="Every published Pine Script is included with active Premium and Pro membership."
        eyebrow="Premium + Pro"
        title="Indicators"
      />

      {!canAccess ? (
        <SoftwareLockedPanel
          message="Upgrade to Premium or Pro to access the Indicators library."
          reason="An active paid membership is required."
        />
      ) : scripts.length || importedScripts.length ? (
        <div className="grid gap-10">
          {scripts.length ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {scripts.map((script) => (
                <CardShell className="flex h-full flex-col gap-5" key={script.id} padding="md" tone="elevated">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge tone="gold">Included</Badge>
                    <Code2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{script.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {script.short_description ?? "Member Pine Script documentation and access."}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                    <Link className={cn(buttonVariants({ variant: "outline" }))} href={`/dashboard/software/${script.slug}`}>
                      View details
                    </Link>
                    {script.member_download_enabled && script.download_storage_path ? (
                      <a className={cn(buttonVariants())} href={`/api/software/${script.id}/download`}>
                        <Download data-icon="inline-start" />
                        Download script
                      </a>
                    ) : (
                      <span className="self-center text-sm text-muted-foreground">Download not published yet</span>
                    )}
                  </div>
                </CardShell>
              ))}
            </div>
          ) : null}

          {importedScripts.length ? (
            <section aria-labelledby="member-imported-indicators-heading">
              <div className="mb-5 max-w-3xl">
                <h2 className="text-2xl font-semibold text-foreground" id="member-imported-indicators-heading">
                  TradingView export library
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  These .pine files contain encrypted TradingView exports. They are provided as uploaded artifacts, not editable Pine source. Each synopsis is based on its export label.
                </p>
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                {importedScripts.map((script) => (
                  <CardShell className="flex h-full flex-col gap-5" key={script.id} padding="md" tone="elevated">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge tone="gold">Included</Badge>
                      <FileArchive className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{script.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{script.description}</p>
                    </div>
                    <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-muted-foreground">{script.kind === "strategy" ? "Strategy export" : "Indicator export"} · {script.version}</span>
                      <a className={cn(buttonVariants())} href={`/api/pinescripts/${script.id}/download`}>
                        <Download data-icon="inline-start" />
                        Download export
                      </a>
                    </div>
                  </CardShell>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <DashboardEmptyState description="Published indicators and strategies will appear here when they are ready." title="No scripts published" />
      )}
    </div>
  );
}
