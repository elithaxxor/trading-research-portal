import type { Database } from "@/types/database.types";

export type ChartType = Database["public"]["Enums"]["chart_type"];

export type TradingViewInterval =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "60"
  | "120"
  | "240"
  | "D"
  | "W"
  | "M";

export type ChartTheme = "dark" | "light";

export type ChartDisplayMode = "widget" | "metadata" | "image" | "placeholder";

export type IdeaChartMetadata =
  Database["public"]["Tables"]["idea_charts"]["Row"];

export type TradingViewWidgetConfig = {
  allowSymbolChange: boolean;
  autosize: boolean;
  calendar: boolean;
  details: boolean;
  hideSideToolbar: boolean;
  interval: TradingViewInterval;
  locale: "en";
  studies: string[];
  style: "1";
  symbol: string;
  theme: ChartTheme;
  timezone: "Etc/UTC";
  withDateRanges: boolean;
};
