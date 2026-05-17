import type { ComponentPropsWithoutRef } from "react";
import { BarChart3 } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { cn } from "@/lib/utils";

type ChartMetadataPanelProps = ComponentPropsWithoutRef<"aside"> & {
  caption: string | null;
  interval: string | null;
  symbol: string | null;
  tradingview_symbol: string | null;
};

export function ChartMetadataPanel({
  caption,
  className,
  interval,
  symbol,
  tradingview_symbol,
  ...props
}: ChartMetadataPanelProps) {
  return (
    <aside className={className} {...props}>
      <CardShell padding="lg">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
            <BarChart3 aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Chart metadata
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Chart preview pending
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              TradingView embeds are not enabled yet. This panel only displays
              saved chart metadata.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <MetadataItem label="Symbol" value={symbol ?? "Not set"} />
          <MetadataItem
            label="TradingView symbol"
            value={tradingview_symbol ?? "Not set"}
          />
          <MetadataItem label="Interval" value={interval ?? "Not set"} />
          <MetadataItem
            className="sm:col-span-2"
            label="Caption"
            value={caption ?? "No caption provided."}
          />
        </dl>
      </CardShell>
    </aside>
  );
}

function MetadataItem({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-secondary/28 p-4", className)}>
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
