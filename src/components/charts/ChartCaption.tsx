import type { ComponentPropsWithoutRef } from "react";

import { formatChartSymbol, formatIntervalLabel } from "@/lib/charts/format";
import { cn } from "@/lib/utils";

type ChartCaptionProps = ComponentPropsWithoutRef<"figcaption"> & {
  caption?: null | string;
  interval?: null | string;
  symbol?: null | string;
};

export function ChartCaption({
  caption,
  className,
  interval,
  symbol,
  ...props
}: ChartCaptionProps) {
  return (
    <figcaption
      className={cn(
        "flex min-w-0 flex-col gap-2 border-t border-border bg-secondary/18 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <span className="min-w-0 leading-6">
        {caption?.trim() || "Chart metadata for educational review."}
      </span>
      <span className="min-w-0 shrink-0 break-all font-mono text-xs uppercase tracking-[0.14em] text-primary">
        {formatChartSymbol(symbol)}
        {interval ? ` - ${formatIntervalLabel(interval)}` : ""}
      </span>
    </figcaption>
  );
}
