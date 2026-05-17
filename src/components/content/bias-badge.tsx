import type { ComponentPropsWithoutRef } from "react";

import { Badge } from "@/components/badge";
import { formatBias } from "@/lib/content/format";
import type { IdeaBias } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type BiasBadgeProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  bias: IdeaBias;
};

const biasStyles: Record<IdeaBias, string> = {
  long: "border-positive/30 bg-positive/10 text-positive",
  neutral: "border-border bg-card text-muted-foreground",
  short: "border-destructive/30 bg-destructive/10 text-destructive",
  watch: "border-primary/35 bg-primary/10 text-primary",
};

export function BiasBadge({ bias, className, ...props }: BiasBadgeProps) {
  return (
    <Badge
      aria-label={`Bias: ${formatBias(bias)}`}
      className={cn(biasStyles[bias], className)}
      tone="muted"
      {...props}
    >
      {formatBias(bias)}
    </Badge>
  );
}
