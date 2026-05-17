import type { ComponentPropsWithoutRef } from "react";
import { LineChart } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { ChartCaption } from "@/components/charts/ChartCaption";
import { cn } from "@/lib/utils";

type LightweightChartPlaceholderProps =
  ComponentPropsWithoutRef<"div"> & {
    caption?: null | string;
    interval?: null | string;
    symbol?: null | string;
  };

export function LightweightChartPlaceholder({
  caption,
  className,
  interval,
  symbol,
  ...props
}: LightweightChartPlaceholderProps) {
  return (
    <CardShell
      className={cn("w-full min-w-0 overflow-hidden", className)}
      padding="none"
      {...props}
    >
      <div className="flex min-h-[360px] w-full min-w-0 flex-col items-center justify-center gap-3 bg-secondary/24 p-6 text-center md:min-h-[420px]">
        <LineChart className="size-10 text-muted-foreground" aria-hidden />
        <div>
          <h3 className="font-semibold text-foreground">
            Custom chart mode coming later
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            This chart type requires curated data.
          </p>
        </div>
      </div>
      <ChartCaption caption={caption} interval={interval} symbol={symbol} />
    </CardShell>
  );
}
