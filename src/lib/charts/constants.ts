import type { ChartTheme, ChartType, TradingViewInterval } from "./types";

export const supportedTradingViewIntervals = [
  "1",
  "3",
  "5",
  "15",
  "30",
  "60",
  "120",
  "240",
  "D",
  "W",
  "M",
] as const satisfies readonly TradingViewInterval[];

export const supportedChartThemes = [
  "dark",
  "light",
] as const satisfies readonly ChartTheme[];

export const allowedChartTypes = [
  "tradingview_embed",
  "image",
  "lightweight_chart",
] as const satisfies readonly ChartType[];

export const defaultTradingViewInterval =
  "D" satisfies TradingViewInterval;

export const defaultChartTheme = "dark" satisfies ChartTheme;
