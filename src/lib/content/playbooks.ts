export type TradingPlaybook = {
  coverPath: string;
  description: string;
  eyebrow: string;
  href: string;
  overview: string;
  pageCount: number;
  pdfPath: string;
  slug: string;
  title: string;
  topics: readonly string[];
};

export const tradingPlaybooks = [
  {
    coverPath: "/images/trader-risk-management-framework-cover.png",
    description:
      "Define risk before entry, size from the stop, control total exposure, and review trading decisions consistently.",
    eyebrow: "Risk management guide",
    href: "/research/trader-risk-management-framework",
    overview:
      "This framework turns risk management into a repeatable operating process. It begins with survival and uncertainty, then develops position sizing, stop placement, R-based review, drawdown control, portfolio-level exposure, and behavioral guardrails. The final sections provide reusable planning and review templates for building more consistent habits.",
    pageCount: 15,
    pdfPath: "/downloads/trader-risk-management-framework.pdf",
    slug: "trader-risk-management-framework",
    title: "Trader's Risk Management Framework",
    topics: [
      "Stop-first position sizing for cash and leveraged products",
      "R-multiples, expectancy, and drawdown recovery",
      "Portfolio heat, correlation, volatility, and liquidity risk",
      "Daily and weekly loss caps with practical kill switches",
      "Beginner, intermediate, and expert risk-management concepts",
      "Daily, weekly, and monthly review templates plus a 30-day plan",
    ],
  },
  {
    coverPath: "/images/cross-asset-ratio-framework-cover.png",
    description:
      "Read relative value across growth, defensive, commodity, credit, and crypto proxies before and after macro shocks.",
    eyebrow: "Cross-asset training manual",
    href: "/research/playbooks/cross-asset-ratio-framework",
    overview:
      "This manual teaches ratios as competitions between economic narratives. It develops a repeatable process for choosing economically linked pairs, measuring raw ratios and log spreads, normalizing moves with z-scores, comparing event windows, confirming regimes, and separating clean beta from business-model or operating leverage.",
    pageCount: 19,
    pdfPath: "/downloads/cross-asset-ratio-framework.pdf",
    slug: "cross-asset-ratio-framework",
    title: "Cross-Asset Ratio Framework",
    topics: [
      "Ratio design for growth, fear, inflation shock, and relief regimes",
      "Raw ratios, log spreads, event returns, and rolling z-scores",
      "Silver versus semiconductors and oil versus airlines case studies",
      "Bitcoin proxy stacks using spot, exchange, treasury, and miner exposure",
      "Anomaly detection, confirmation matrices, and volatility scaling",
      "A practical ratio library with daily and weekly worksheets",
    ],
  },
  {
    coverPath: "/images/triple-witching-trading-playbook-cover.png",
    description:
      "Prepare for quarterly expiration flow with settlement mechanics, positioning regimes, risk controls, and a T-5 to T+1 checklist.",
    eyebrow: "Event trading playbook",
    href: "/research/playbooks/triple-witching-trading-playbook",
    overview:
      "This playbook treats triple witching as a scheduled risk-transfer event rather than a directional prediction. It explains how settlement conventions, auction concentration, futures rolls, strike positioning, and hedge unwinds can shape the open, midday rotation, power hour, and the session after expiration.",
    pageCount: 10,
    pdfPath: "/downloads/triple-witching-trading-playbook.pdf",
    slug: "triple-witching-trading-playbook",
    title: "Triple Witching Trading Playbook",
    topics: [
      "Stock, ETF, index option, and equity futures settlement mechanics",
      "Pin and mean-reversion versus break and expansion regimes",
      "A preparation timeline from T-5 through the post-expiration session",
      "Pin-and-fade, acceptance breakout, and late-day unwind setups",
      "Assignment, liquidity, lead-month, auction, and process-risk controls",
      "A reusable daily prep sheet and quarterly planning calendar",
    ],
  },
] as const satisfies readonly TradingPlaybook[];

export function getTradingPlaybook(slug: string) {
  return tradingPlaybooks.find((playbook) => playbook.slug === slug) ?? null;
}
