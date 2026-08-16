"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { ChartCaption } from "@/components/charts/ChartCaption";
import { ChartFallback } from "@/components/charts/ChartFallback";
import type { ChartTheme } from "@/lib/charts/types";
import { buildTradingViewWidgetConfig } from "@/lib/charts/validation";
import { cn } from "@/lib/utils";

type TradingViewAdvancedChartProps = {
  autosize?: boolean;
  caption?: null | string;
  className?: string;
  height?: number | string;
  interval?: null | string;
  studies?: readonly string[] | null;
  symbol?: null | string;
  theme?: ChartTheme;
};

type TradingViewWidgetOptions = Record<string, unknown> & {
  container_id: string;
};

type TradingViewGlobal = {
  widget: new (options: TradingViewWidgetOptions) => unknown;
};

declare global {
  interface Window {
    TradingView?: TradingViewGlobal;
  }
}

const tradingViewScriptId = "tradingview-widget-library";
const tradingViewScriptSrc = "https://s3.tradingview.com/tv.js";

let tradingViewScriptPromise: null | Promise<void> = null;

function formatCssSize(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

function loadTradingViewScript() {
  if (window.TradingView) {
    return Promise.resolve();
  }

  if (tradingViewScriptPromise) {
    return tradingViewScriptPromise;
  }

  tradingViewScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(tradingViewScriptId);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("TradingView script failed to load.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.id = tradingViewScriptId;
    script.src = tradingViewScriptSrc;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("TradingView script failed to load."));

    document.head.appendChild(script);
  });

  return tradingViewScriptPromise;
}

export function TradingViewAdvancedChart({
  autosize = true,
  caption,
  className,
  height = 420,
  interval,
  studies,
  symbol,
  theme = "dark",
}: TradingViewAdvancedChartProps) {
  const reactId = useId();
  const containerId = useMemo(
    () => `tradingview-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId]
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"error" | "loading" | "ready">(
    "loading"
  );

  const configResult = useMemo(
    () =>
      buildTradingViewWidgetConfig({
        interval,
        studies,
        symbol,
        theme,
      }),
    [interval, studies, symbol, theme]
  );

  const chartStyle = {
    "--chart-height": formatCssSize(height),
  } as CSSProperties;

  useEffect(() => {
    if (!configResult.ok) {
      return;
    }

    let mounted = true;
    const container = containerRef.current;

    if (!container) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    container.innerHTML = "";

    loadTradingViewScript()
      .then(() => {
        if (!mounted || !window.TradingView || !container.isConnected) {
          return;
        }

        container.innerHTML = "";

        new window.TradingView.widget({
          ...configResult.value,
          autosize,
          container_id: containerId,
          height: autosize ? undefined : height,
          width: "100%",
        });

        setStatus("ready");
      })
      .catch(() => {
        if (mounted) {
          setStatus("error");
        }
      });

    return () => {
      mounted = false;

      container.innerHTML = "";
    };
  }, [autosize, configResult, containerId, height]);

  if (!configResult.ok || status === "error") {
    return (
      <ChartFallback
        className={className}
        description={
          configResult.ok
            ? "TradingView could not load this chart. Check chart metadata in admin."
            : "Check chart metadata in admin."
        }
        title={configResult.ok ? "Preview unavailable" : "Chart symbol unavailable"}
      />
    );
  }

  return (
    <figure
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card/72 shadow-[0_22px_70px_oklch(0.05_0.02_235_/_30%)]",
        className
      )}
      aria-busy={status === "loading"}
      aria-label={`TradingView chart region for ${configResult.value.symbol}`}
      role="region"
    >
      <div
        className="relative h-[360px] min-w-0 overflow-hidden bg-background md:h-[var(--chart-height)]"
        style={chartStyle}
      >
        {status === "loading" ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/82 p-6 text-sm text-muted-foreground backdrop-blur-sm"
            role="status"
          >
            <span className="sr-only">Loading chart...</span>
            <div
              className="grid w-full max-w-md animate-pulse gap-3"
              aria-hidden
            >
              <div className="h-3 w-2/5 rounded bg-border/70" />
              <div className="grid h-44 grid-cols-4 gap-2 rounded-lg border border-border/70 bg-card/60 p-3">
                <div className="rounded bg-secondary/70" />
                <div className="rounded bg-secondary/55" />
                <div className="rounded bg-secondary/75" />
                <div className="rounded bg-secondary/45" />
              </div>
              <div className="flex gap-2">
                <div className="h-2 flex-1 rounded bg-border/55" />
                <div className="h-2 flex-1 rounded bg-border/40" />
                <div className="h-2 flex-1 rounded bg-border/60" />
              </div>
            </div>
            <span>Loading chart...</span>
          </div>
        ) : null}
        <div
          ref={containerRef}
          className="size-full"
          id={containerId}
          aria-label={`TradingView chart for ${configResult.value.symbol}`}
          role="img"
        />
      </div>
      <ChartCaption
        caption={caption}
        interval={configResult.value.interval}
        symbol={configResult.value.symbol}
      />
    </figure>
  );
}
