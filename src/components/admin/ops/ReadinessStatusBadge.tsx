import { Badge } from "@/components/badge";
import { formatOpsCheckStatus } from "@/lib/ops/format";
import type { OpsCheckStatus } from "@/lib/ops/types";

type ReadinessStatusBadgeProps = {
  status: OpsCheckStatus;
};

export function ReadinessStatusBadge({ status }: ReadinessStatusBadgeProps) {
  const tone =
    status === "passing"
      ? "positive"
      : status === "warning" || status === "pending"
        ? "gold"
        : status === "skipped"
          ? "muted"
          : "default";

  return <Badge tone={tone}>{formatOpsCheckStatus(status)}</Badge>;
}
