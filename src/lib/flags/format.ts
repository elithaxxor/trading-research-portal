import type { FeatureFlagKey, FeatureFlagState } from "./types";

export function formatFeatureFlagKey(key: FeatureFlagKey) {
  return key
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatFeatureFlagState(flag: FeatureFlagState | boolean) {
  const enabled = typeof flag === "boolean" ? flag : flag.enabled;

  return enabled ? "Enabled" : "Disabled";
}

export function getFeatureFlagTone(flag: FeatureFlagState | boolean) {
  const enabled = typeof flag === "boolean" ? flag : flag.enabled;

  return enabled ? ("positive" as const) : ("muted" as const);
}
