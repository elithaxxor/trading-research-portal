import "server-only";

import { featureFlagDefinitions } from "./config";
import type { FeatureFlagKey, FeatureFlagState } from "./types";
import { featureFlagKeys } from "./types";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

function getOptionalEnv(name: string) {
  return process.env[name]?.trim();
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return fallback;
}

function getConfiguredEnvValue(key: FeatureFlagKey) {
  const definition = featureFlagDefinitions[key];
  const envVars = [definition.envVar, ...(definition.fallbackEnvVars ?? [])];

  for (const envVar of envVars) {
    const value = getOptionalEnv(envVar);

    if (value) {
      return {
        envVar,
        value,
      };
    }
  }

  return {
    envVar: definition.envVar,
    value: undefined,
  };
}

export function getFeatureFlagState(key: FeatureFlagKey): FeatureFlagState {
  const definition = featureFlagDefinitions[key];
  const configured = getConfiguredEnvValue(key);
  const enabled = parseBoolean(configured.value, definition.defaultEnabled);

  return {
    ...definition,
    enabled,
    rawValue: configured.value ? "set" : "unset",
    source: configured.value ? "env" : "default",
    sourceEnvVar: configured.envVar,
  };
}

export function isFeatureEnabled(key: FeatureFlagKey) {
  return getFeatureFlagState(key).enabled;
}

export function listFeatureFlags() {
  return featureFlagKeys.map(getFeatureFlagState);
}

export function requireFeatureEnabled(key: FeatureFlagKey) {
  if (!isFeatureEnabled(key)) {
    const flag = getFeatureFlagState(key);
    throw new Error(`${flag.label} is disabled by launch controls.`);
  }
}
