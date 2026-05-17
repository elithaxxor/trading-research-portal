import {
  allowedChartTypes,
  defaultChartTheme,
  defaultTradingViewInterval,
  supportedChartThemes,
  supportedTradingViewIntervals,
} from "./constants";
import type {
  ChartTheme,
  ChartType,
  TradingViewInterval,
  TradingViewWidgetConfig,
} from "./types";

type ValidationResult<TValue> =
  | {
      error: string;
      ok: false;
    }
  | {
      ok: true;
      value: TValue;
    };

type TradingViewWidgetInput = {
  interval?: null | string;
  symbol?: null | string;
  theme?: ChartTheme | null | string;
  tradingview_symbol?: null | string;
};

const tickerPattern = /^[A-Z0-9.-]+$/;
const tradingViewSymbolPattern = /^[A-Z0-9_:.!/-]+$/;
const unsafeSymbolPattern = /[<>"'`{}\\]/;
const safeChartUrlProtocols = new Set(["http:", "https:"]);

function valid<TValue>(value: TValue): ValidationResult<TValue> {
  return {
    ok: true,
    value,
  };
}

function invalid<TValue = never>(error: string): ValidationResult<TValue> {
  return {
    error,
    ok: false,
  };
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateAllowedValue<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallbackValue: TValue,
  label: string
) {
  const normalized = getStringValue(value);

  if (!normalized) {
    return valid(fallbackValue);
  }

  if (!allowedValues.includes(normalized as TValue)) {
    return invalid(`Choose a valid ${label.toLowerCase()}.`);
  }

  return valid(normalized as TValue);
}

function normalizeSymbol(value: unknown, uppercase: boolean) {
  const normalized = getStringValue(value);

  return uppercase ? normalized.toUpperCase() : normalized;
}

export function normalizeTradingViewSymbol(
  value: unknown
): ValidationResult<string> {
  const normalized = normalizeSymbol(value, true);

  if (!normalized) {
    return invalid("TradingView symbol is required.");
  }

  if (normalized.length > 64) {
    return invalid("TradingView symbol must be 64 characters or fewer.");
  }

  if (
    unsafeSymbolPattern.test(normalized) ||
    !tradingViewSymbolPattern.test(normalized)
  ) {
    return invalid(
      "TradingView symbol may contain letters, numbers, underscores, colons, periods, slashes, hyphens, and exclamation marks only."
    );
  }

  return valid(normalized);
}

export function normalizeTickerSymbol(value: unknown): ValidationResult<string> {
  const normalized = normalizeSymbol(value, true);

  if (!normalized) {
    return invalid("Ticker symbol is required.");
  }

  if (normalized.length > 20) {
    return invalid("Ticker symbol must be 20 characters or fewer.");
  }

  if (unsafeSymbolPattern.test(normalized) || !tickerPattern.test(normalized)) {
    return invalid(
      "Ticker symbol may contain letters, numbers, periods, and hyphens only."
    );
  }

  return valid(normalized);
}

export function validateTradingViewInterval(
  value: unknown
): ValidationResult<TradingViewInterval> {
  return validateAllowedValue(
    value,
    supportedTradingViewIntervals,
    defaultTradingViewInterval,
    "TradingView interval"
  );
}

export function validateChartType(value: unknown): ValidationResult<ChartType> {
  return validateAllowedValue(
    value,
    allowedChartTypes,
    "tradingview_embed",
    "Chart type"
  );
}

export function validateChartTheme(
  value: unknown
): ValidationResult<ChartTheme> {
  return validateAllowedValue(
    value,
    supportedChartThemes,
    defaultChartTheme,
    "Chart theme"
  );
}

export function isSafeExternalChartUrl(value: unknown) {
  const normalized = getStringValue(value);

  if (!normalized) {
    return false;
  }

  try {
    const url = new URL(normalized);

    return safeChartUrlProtocols.has(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeChartUrl(value: unknown) {
  const normalized = getStringValue(value);

  if (!normalized) {
    return null;
  }

  return isSafeExternalChartUrl(normalized) ? normalized : null;
}

export function buildTradingViewWidgetConfig(
  input: TradingViewWidgetInput
): ValidationResult<TradingViewWidgetConfig> {
  const symbolResult = normalizeTradingViewSymbol(
    input.tradingview_symbol ?? input.symbol
  );

  if (!symbolResult.ok) {
    return symbolResult;
  }

  const intervalResult = validateTradingViewInterval(input.interval);

  if (!intervalResult.ok) {
    return intervalResult;
  }

  const themeResult = validateChartTheme(input.theme);

  if (!themeResult.ok) {
    return themeResult;
  }

  return valid({
    allowSymbolChange: false,
    autosize: true,
    calendar: false,
    details: false,
    hideSideToolbar: false,
    interval: intervalResult.value,
    locale: "en",
    studies: [],
    style: "1",
    symbol: symbolResult.value,
    theme: themeResult.value,
    timezone: "Etc/UTC",
    withDateRanges: true,
  });
}
