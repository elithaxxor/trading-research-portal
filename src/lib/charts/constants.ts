import type {
  ChartTheme,
  ChartType,
  TradingViewInterval,
  TradingViewStudy,
} from "./types";

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

export const tradingViewStudyOptions = [
  {
    description: "Overlay a standard simple moving average.",
    label: "Simple moving average",
    value: "STD;SMA",
  },
  {
    description: "Overlay a standard exponential moving average.",
    label: "Exponential moving average",
    value: "STD;EMA",
  },
  {
    description: "Add the Relative Strength Index pane.",
    label: "RSI",
    value: "STD;RSI",
  },
  {
    description: "Add the Moving Average Convergence Divergence pane.",
    label: "MACD",
    value: "STD;MACD",
  },
] as const satisfies readonly {
  description: string;
  label: string;
  value: TradingViewStudy;
}[];

export const supportedTradingViewStudies = tradingViewStudyOptions.map(
  (option) => option.value
) as TradingViewStudy[];

export const defaultTradingViewStudies = [
  "STD;EMA",
  "STD;RSI",
] as const satisfies readonly TradingViewStudy[];
