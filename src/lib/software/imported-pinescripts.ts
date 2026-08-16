import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

export type ImportedPineScript = {
  description: string;
  downloadName: string;
  fileName: string;
  id: string;
  kind: "indicator" | "strategy";
  title: string;
  version: string;
};

const exportIdPattern = /;([a-f\d]{32})\.pine(?:\.txt)?$/i;

function cleanTitle(fileName: string) {
  const exportedTitle = fileName.split("_USER;")[0] ?? fileName;

  return exportedTitle
    .replace(/_/g, " ")
    .replace(/•/g, "-")
    .replace(/→/g, "to")
    .replace(/—/g, "-")
    .replace(/[\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getVersion(title: string) {
  const labels = title.match(/\b(?:v\d+|PRO|LITE|MVP|FINAL)\b/gi) ?? [];

  return labels.length > 0 ? [...new Set(labels)].join(" · ") : "Imported export";
}

function getSynopsis(title: string) {
  const value = title.toLowerCase();

  if (value.includes("10am") && value.includes("actionable strategy")) {
    return "A strategy-labeled export centered on the 10:00 a.m. four-hour candle and Power of Three structure, with actionable trade-rule framing.";
  }
  if (value.includes("10am") && value.includes("po3 toolkit")) {
    return "A chart toolkit labeled for studying the 10:00 a.m. four-hour candle through accumulation, manipulation, and distribution context.";
  }
  if (value.includes("20-day sma")) {
    return "A long-strategy export labeled around momentum pullbacks to the 20-day simple moving average.";
  }
  if (value.includes("arb basket") && value.includes("auto basket strategy")) {
    return "A strategy export labeled for comparing an asset with an automatically constructed basket-based fair-value estimate.";
  }
  if (value.includes("arb basket") && value.includes("profit strategy")) {
    return "A deep-research strategy variant labeled for basket fair-value deviations, regime context, and rule-based position management.";
  }
  if (value.includes("arb basket") && value.includes("profit indicator")) {
    return "A deep-research indicator variant labeled for visualizing basket fair value, deviations, and regime-aware opportunity context.";
  }
  if (value.includes("arb basket") && value.includes("research engine")) {
    return "A research-engine export labeled for building and evaluating basket-derived fair value and relative-value regimes.";
  }
  if (value.includes("arb basket") && value.includes("regime-gated")) {
    return "A basket fair-value indicator labeled with regime gates intended to filter relative-value signals by market conditions.";
  }
  if (value.includes("arb basket") && value.includes("approx")) {
    return "An approximate basket fair-value indicator for comparing the charted asset with a proxy-derived reference value.";
  }
  if (value.includes("auto proxy ratio")) {
    return "An MVP indicator labeled for automatically selecting proxy relationships and translating relative ratios into a directional bias.";
  }
  if (value.includes("support") && value.includes("resistance")) {
    return value.includes("pro")
      ? "A Pro adaptive-pivot overlay labeled for maintaining expanded support and resistance zones as market structure evolves."
      : "A Lite adaptive-pivot overlay labeled for plotting streamlined support and resistance zones.";
  }
  if (value.includes("avwap")) {
    return "A swing-strategy export organized around anchored VWAP context and rule-based swing entries and exits.";
  }
  if (value.includes("breakout") && value.includes("retest")) {
    return "A long-strategy export labeled for breakouts confirmed by volume, followed by a retest and continuation setup.";
  }
  if (value.includes("bollinger") && value.includes("rsi")) {
    return "A Bitcoin mean-reversion strategy labeled for range regimes using Bollinger Bands and RSI conditions.";
  }
  if (value.includes("donchian") && value.includes("atr")) {
    return "A Bitcoin breakout strategy labeled around Donchian channels, ATR-based risk logic, and a market-regime filter.";
  }
  if (value.includes("catalyst finder")) {
    return "A dashboard-style indicator labeled for surfacing technical or market-condition catalysts in one compact review panel.";
  }
  if (value.includes("contraction") && value.includes("expansion")) {
    return value.includes("strategy")
      ? "A long-strategy export labeled for volatility contraction, expansion confirmation, and exhaustion-aware exits."
      : "An indicator export labeled for identifying contraction-to-expansion moves and issuing long-exit alerts near exhaustion.";
  }
  if (value.includes("cross asset")) {
    return "A cross-asset research suite labeled for comparing intermarket proxies, relative behavior, and broader risk context.";
  }
  if (value.includes("chart patterns")) {
    return "A broad pattern-recognition indicator labeled for dynamically rebuilding and displaying multiple chart-pattern structures.";
  }
  if (value.includes("etf sentiment") && value.includes("pro safe")) {
    return "A Pro-safe ETF rotation dashboard labeled with a bias engine and embedded stock-leader comparisons.";
  }
  if (value.includes("etf sentiment") && value.includes("stock leaders")) {
    return "A Pro ETF sentiment dashboard labeled for regime bias, sector rotation, and stock-leader monitoring.";
  }
  if (value.includes("etf sentiment") && value.includes("rvol")) {
    return "An expanded ETF rotation tracker labeled with offense/defense groupings and relative-volume context.";
  }
  if (value.includes("etf sentiment")) {
    return "An ETF sentiment tracker labeled for comparing offensive, defensive, and thematic market groups.";
  }
  if (value.includes("floating market level")) {
    return "A lightweight overlay labeled for keeping a selected market reference level visible as the chart viewport changes.";
  }
  if (value.includes("gamma regime")) {
    return "A regime-map indicator labeled for visualizing options-gamma proxies and their potential relationship to market behavior.";
  }
  if (value.includes("hybrid liquidity pockets")) {
    return "A liquidity-mapping indicator labeled for combining footprint-style price and volume structure with options-market proxies.";
  }

  return "An encrypted TradingView export included in the protected member indicator library.";
}

function createDownloadName(title: string) {
  return `${title.replace(/[^a-z\d]+/gi, "_").replace(/^_+|_+$/g, "")}.pine`;
}

export async function listImportedPineScripts(): Promise<ImportedPineScript[]> {
  const entries = await readdir(
    path.join(process.cwd(), "private", "pinescripts"),
    { withFileTypes: true }
  );

  return entries
    .filter((entry) => entry.isFile() && exportIdPattern.test(entry.name))
    .map((entry) => {
      const id = entry.name.match(exportIdPattern)?.[1] ?? entry.name;
      const title = cleanTitle(entry.name);

      return {
        description: getSynopsis(title),
        downloadName: createDownloadName(title),
        fileName: entry.name,
        id,
        kind: title.toLowerCase().includes("strategy")
          ? ("strategy" as const)
          : ("indicator" as const),
        title,
        version: getVersion(title),
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

export async function getImportedPineScript(id: string) {
  const scripts = await listImportedPineScripts();

  return scripts.find((script) => script.id === id) ?? null;
}
