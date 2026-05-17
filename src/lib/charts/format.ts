import type { ChartType, TradingViewInterval } from "./types";

const intervalLabels: Record<TradingViewInterval, string> = {
  "1": "1 minute",
  "3": "3 minutes",
  "5": "5 minutes",
  "15": "15 minutes",
  "30": "30 minutes",
  "60": "1 hour",
  "120": "2 hours",
  "240": "4 hours",
  D: "Daily",
  M: "Monthly",
  W: "Weekly",
};

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatChartType(chartType: ChartType) {
  return formatEnumLabel(chartType);
}

export function formatIntervalLabel(interval: TradingViewInterval | string) {
  return intervalLabels[interval as TradingViewInterval] ?? interval;
}

export function formatChartSymbol(symbol: null | string | undefined) {
  return symbol?.trim().toUpperCase() || "No symbol";
}
