import { Badge } from "@/components/badge";
import { formatIncidentSeverity } from "@/lib/ops/format";

type IncidentSeverityBadgeProps = {
  severity: string;
};

export function IncidentSeverityBadge({
  severity,
}: IncidentSeverityBadgeProps) {
  const normalized = severity.toLowerCase();
  const tone =
    normalized === "critical" || normalized === "high"
      ? "default"
      : normalized === "medium"
        ? "gold"
        : "muted";

  return <Badge tone={tone}>{formatIncidentSeverity(severity)}</Badge>;
}
