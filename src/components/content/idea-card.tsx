import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/content/format";
import type {
  AssetClass,
  ContentVisibility,
  IdeaBias,
  IdeaStatus,
  RiskLevel,
} from "@/lib/content/types";
import { cn } from "@/lib/utils";

import { AssetClassBadge } from "./asset-class-badge";
import { BiasBadge } from "./bias-badge";
import { IdeaStatusBadge } from "./idea-status-badge";
import { RiskBadge } from "./risk-badge";
import { VisibilityBadge } from "./visibility-badge";

type IdeaCardProps = ComponentPropsWithoutRef<"article"> & {
  asset_class: AssetClass;
  bias: IdeaBias;
  is_locked: boolean;
  lockedCtaHref?: string;
  lockedCtaLabel?: string;
  public_preview: string | null;
  published_at: string | null;
  risk_level: RiskLevel;
  setup_type: string | null;
  slug: string;
  status: IdeaStatus;
  ticker: string;
  timeframe: string | null;
  title: string;
  visibility: ContentVisibility;
};

export function IdeaCard({
  asset_class,
  bias,
  className,
  is_locked,
  lockedCtaHref,
  lockedCtaLabel = "View access options",
  public_preview,
  published_at,
  risk_level,
  setup_type,
  slug,
  status,
  ticker,
  timeframe,
  title,
  visibility,
  ...props
}: IdeaCardProps) {
  const href = `/ideas/${slug}`;
  const ctaHref = is_locked ? lockedCtaHref ?? href : href;
  const ctaLabel = is_locked ? lockedCtaLabel : "Read research";

  return (
    <article className={className} {...props}>
      <CardShell
        className={cn(
          "flex h-full flex-col gap-6 overflow-hidden",
          is_locked && "border-primary/35 bg-primary/6"
        )}
        padding="lg"
        tone={is_locked ? "elevated" : "default"}
      >
        {is_locked ? <div className="h-px bg-market-line" /> : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <VisibilityBadge visibility={visibility} />
              <AssetClassBadge assetClass={asset_class} />
              {is_locked ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[0.68rem] font-medium uppercase leading-none tracking-[0.16em] text-primary">
                  <LockKeyhole aria-hidden />
                  Locked
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {ticker}
              </p>
              <h2 className="text-balance text-2xl font-semibold text-foreground">
                <Link
                  className="outline-none transition-colors hover:text-primary focus-visible:text-primary"
                  href={href}
                >
                  {title}
                </Link>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <BiasBadge bias={bias} />
            <IdeaStatusBadge status={status} />
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <Metric label="Timeframe" value={timeframe ?? "Review"} />
          <Metric label="Setup" value={setup_type ?? "Research note"} />
          <Metric label="Published" value={formatDate(published_at)} />
        </dl>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-foreground">
              Public preview
            </p>
            <RiskBadge riskLevel={risk_level} />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {public_preview ??
              "Public-safe preview copy is being prepared for this research card."}
          </p>
        </div>

        {is_locked ? (
          <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Full thesis, levels, updates, and risk notes are protected by member
            access.
          </p>
        ) : null}

        <Link
          className={cn(
            "mt-auto w-full sm:w-fit",
            buttonVariants({
              size: "lg",
              variant: is_locked ? "outline" : "default",
            })
          )}
          href={ctaHref}
        >
          {ctaLabel}
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </CardShell>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/28 p-4">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 truncate text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
