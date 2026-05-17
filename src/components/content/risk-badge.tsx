import type { ComponentPropsWithoutRef } from "react";

import { Badge } from "@/components/badge";
import { formatRiskLevel } from "@/lib/content/format";
import type { RiskLevel } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type RiskBadgeProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  riskLevel: RiskLevel;
};

const riskStyles: Record<RiskLevel, string> = {
  high: "border-destructive/30 bg-destructive/10 text-destructive",
  low: "border-positive/30 bg-positive/10 text-positive",
  medium: "border-primary/35 bg-primary/10 text-primary",
};

export function RiskBadge({
  className,
  riskLevel,
  ...props
}: RiskBadgeProps) {
  return (
    <Badge
      aria-label={`Risk level: ${formatRiskLevel(riskLevel)}`}
      className={cn(riskStyles[riskLevel], className)}
      tone="muted"
      {...props}
    >
      {formatRiskLevel(riskLevel)}
    </Badge>
  );
}
