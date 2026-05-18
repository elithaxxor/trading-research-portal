import type {
  SoftwareAccessRequestStatus,
  SoftwareAccessTier,
  SoftwareDeliveryType,
  SoftwareType,
} from "./types";

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatSoftwareAccessTier(tier: SoftwareAccessTier) {
  if (tier === "premium_lite") {
    return "Premium Lite";
  }

  return "Pro";
}

export function formatSoftwareType(type: SoftwareType) {
  if (type === "pinescript") {
    return "Pine Script";
  }

  return formatEnumLabel(type);
}

export function formatSoftwareDeliveryType(type: SoftwareDeliveryType) {
  if (type === "tradingview_invite_only") {
    return "TradingView invite-only";
  }

  return formatEnumLabel(type);
}

export function formatSoftwareAccessStatus(
  status: SoftwareAccessRequestStatus
) {
  return formatEnumLabel(status);
}
