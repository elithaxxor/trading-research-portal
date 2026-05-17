import type {
  ContentVisibility,
  IdeaStatus,
} from "./types";
import type { Database } from "@/types/database.types";

type IdeaBias = Database["public"]["Enums"]["idea_bias"];
type RiskLevel = Database["public"]["Enums"]["risk_level"];

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not dated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not dated";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function formatVisibilityLabel(visibility: ContentVisibility) {
  return formatEnumLabel(visibility);
}

export function formatIdeaStatus(status: IdeaStatus) {
  return formatEnumLabel(status);
}

export function formatBias(bias: IdeaBias) {
  return formatEnumLabel(bias);
}

export function formatRiskLevel(riskLevel: RiskLevel) {
  return formatEnumLabel(riskLevel);
}
