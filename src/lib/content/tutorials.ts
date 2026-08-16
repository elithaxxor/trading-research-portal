import tutorialsManifest from "./tutorials-manifest.json";

export type TradingTutorial = {
  category: string;
  description: string;
  pdfPath: string;
  slug: string;
  title: string;
};

const descriptions: Array<[RegExp, string]> = [
  [/vwap|anchored vwap/i, "A practical guide to using VWAP and anchored VWAP for value, participation, entries, and market context."],
  [/risk|stop loss|atr volatility/i, "A risk-first tutorial covering position control, volatility awareness, invalidation, and repeatable trade planning."],
  [/options|gamma|delta|iv |implied volatility|condor|butterfl/i, "An options-focused guide to structure, volatility, positioning, and defined-risk decision making."],
  [/liquidity|order imbalance|bid ask|market maker|order mechanics/i, "A market-microstructure guide to liquidity, order flow, execution context, and price response."],
  [/bitcoin|btc|crypto/i, "A crypto-market tutorial covering structure, cross-market context, regimes, and disciplined trade preparation."],
  [/macro|fundamental|earnings|catalyst|sector/i, "A research framework for connecting macro, sector, earnings, and catalyst evidence to a structured market view."],
  [/gap|overnight|opening range|orb/i, "A session-focused playbook for evaluating opening gaps, confirmation, failure, and intraday risk."],
  [/market structure|support|resistance|trendline|supply demand/i, "A chart-structure guide to trend, support, resistance, supply, demand, and confirmation across timeframes."],
  [/moving average|sma|ema/i, "A tutorial on using moving averages as trend, momentum, and confluence tools without treating them as standalone signals."],
  [/breakout|fakeout|compression|contraction|expansion/i, "A confirmation-first framework for distinguishing constructive breakouts from failed moves and low-quality signals."],
  [/cross asset|ratio|gold|oil|commodity|arb basket/i, "A cross-asset research guide for comparing related markets, relative value, and broader regime context."],
  [/regime|environment|bias/i, "A market-regime framework for adapting tactics to trend, range, volatility, and participation conditions."],
  [/psychology|fomo|decision fatigue|journal/i, "A process-oriented guide to trading psychology, decision quality, discipline, and reflective practice."],
  [/scanner|screener|heatmap|premarket/i, "A workflow guide for screening, prioritizing candidates, and converting broad market data into a focused watchlist."],
  [/scalp|intraday|session|time of day|power hour/i, "An intraday tutorial focused on session structure, timing, participation, and controlled execution."],
  [/swing|multi timeframe|top down/i, "A multi-timeframe guide for aligning broader structure with tactical swing-trade planning."],
  [/ai |social sentiment|robotics|semiconductor/i, "A thematic research workflow for organizing evidence, catalysts, and verification around technology-driven markets."],
  [/pair|statistical arbitrage|algorithmic|backtest|simulation/i, "A quantitative tutorial covering systematic hypotheses, relative relationships, testing, and model-aware risk."],
];

function describeTutorial(title: string, category: string) {
  const match = descriptions.find(([pattern]) => pattern.test(title));

  return (
    match?.[1] ??
    `An educational ${category.toLowerCase()} guide focused on structured analysis, repeatable preparation, and risk-aware decision making.`
  );
}

export const tradingTutorials: TradingTutorial[] = tutorialsManifest.map(
  (tutorial) => ({
    ...tutorial,
    description: describeTutorial(tutorial.title, tutorial.category),
  })
);

export const tutorialCategories = Array.from(
  new Set(tradingTutorials.map((tutorial) => tutorial.category))
).sort((a, b) => a.localeCompare(b));
