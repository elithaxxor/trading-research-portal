import type { ComponentPropsWithoutRef } from "react";

import { Badge } from "@/components/badge";
import { formatIdeaStatus } from "@/lib/content/format";
import type { IdeaStatus } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type IdeaStatusBadgeProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  status: IdeaStatus;
};

const statusStyles: Record<IdeaStatus, string> = {
  active: "border-positive/30 bg-positive/10 text-positive",
  closed: "border-border bg-card text-muted-foreground",
  invalidated: "border-destructive/30 bg-destructive/10 text-destructive",
  target_hit: "border-primary/35 bg-primary/10 text-primary",
  triggered: "border-accent/35 bg-accent/10 text-accent",
  watching: "border-border bg-secondary text-muted-foreground",
};

export function IdeaStatusBadge({
  className,
  status,
  ...props
}: IdeaStatusBadgeProps) {
  return (
    <Badge
      aria-label={`Idea status: ${formatIdeaStatus(status)}`}
      className={cn(statusStyles[status], className)}
      tone="muted"
      {...props}
    >
      {formatIdeaStatus(status)}
    </Badge>
  );
}
