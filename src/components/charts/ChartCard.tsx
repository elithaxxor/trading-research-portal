import type { ComponentPropsWithoutRef } from "react";
import { ImageIcon } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { ChartCaption } from "@/components/charts/ChartCaption";
import { ChartFallback } from "@/components/charts/ChartFallback";
import { LightweightChartPlaceholder } from "@/components/charts/LightweightChartPlaceholder";
import { TradingViewAdvancedChart } from "@/components/charts/TradingViewAdvancedChart";
import type { ChartTheme, IdeaChartMetadata } from "@/lib/charts/types";
import {
  buildTradingViewWidgetConfig,
  sanitizeChartUrl,
  validateChartType,
} from "@/lib/charts/validation";
import { cn } from "@/lib/utils";

type ChartCardProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  chart: IdeaChartMetadata;
  height?: number | string;
  theme?: ChartTheme;
};

export function ChartCard({
  chart,
  className,
  height,
  theme = "dark",
  ...props
}: ChartCardProps) {
  const chartType = validateChartType(chart.chart_type);

  if (!chartType.ok) {
    return (
      <section className={cn("w-full min-w-0", className)} {...props}>
        <ChartFallback
          description="Check chart metadata in admin."
          title="Unsupported chart type"
        />
      </section>
    );
  }

  if (chartType.value === "tradingview_embed") {
    const previewConfig = buildTradingViewWidgetConfig({
      interval: chart.interval,
      symbol: chart.symbol,
      theme,
      tradingview_symbol: chart.tradingview_symbol,
    });

    if (!previewConfig.ok) {
      return (
        <section className={cn("w-full min-w-0", className)} {...props}>
          <ChartFallback
            description="Check chart metadata in admin."
            title="Chart symbol unavailable"
          />
        </section>
      );
    }

    return (
      <section className={cn("w-full min-w-0", className)} {...props}>
        <TradingViewAdvancedChart
          caption={chart.caption}
          height={height}
          interval={previewConfig.value.interval}
          symbol={previewConfig.value.symbol}
          theme={theme}
        />
      </section>
    );
  }

  if (chartType.value === "image") {
    const imageUrl = sanitizeChartUrl(chart.image_url);
    const imageStyle = imageUrl
      ? {
          backgroundImage: `url(${JSON.stringify(imageUrl)})`,
        }
      : undefined;

    return (
      <section className={cn("w-full min-w-0", className)} {...props}>
        <CardShell className="w-full min-w-0 overflow-hidden" padding="none">
          {imageUrl ? (
            <div
              aria-label={chart.caption ?? chart.symbol ?? "Chart image"}
              className="min-h-[360px] w-full min-w-0 bg-background bg-contain bg-center bg-no-repeat md:min-h-[420px]"
              role="img"
              style={imageStyle}
            />
          ) : (
            <div className="flex min-h-[360px] w-full min-w-0 flex-col items-center justify-center gap-3 bg-secondary/24 p-6 text-center md:min-h-[420px]">
              <ImageIcon className="size-10 text-muted-foreground" aria-hidden />
              <div>
                <h3 className="font-semibold text-foreground">
                  Image chart placeholder
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a safe image URL to display this chart.
                </p>
              </div>
            </div>
          )}
          <ChartCaption
            caption={chart.caption}
            interval={chart.interval}
            symbol={chart.symbol ?? chart.tradingview_symbol}
          />
        </CardShell>
      </section>
    );
  }

  return (
    <section className={cn("w-full min-w-0", className)} {...props}>
      <LightweightChartPlaceholder
        caption={chart.caption}
        interval={chart.interval}
        symbol={chart.symbol ?? chart.tradingview_symbol}
      />
    </section>
  );
}
