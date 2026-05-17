import type { ComponentPropsWithoutRef } from "react";

import { Badge } from "@/components/badge";
import { formatVisibilityLabel } from "@/lib/content/format";
import type { ContentVisibility } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type VisibilityBadgeProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  visibility: ContentVisibility;
};

const visibilityStyles: Record<ContentVisibility, string> = {
  free: "border-positive/30 bg-positive/10 text-positive",
  premium: "border-primary/35 bg-primary/10 text-primary",
  pro: "border-accent/35 bg-accent/10 text-accent",
};

export function VisibilityBadge({
  className,
  visibility,
  ...props
}: VisibilityBadgeProps) {
  return (
    <Badge
      aria-label={`Visibility: ${formatVisibilityLabel(visibility)}`}
      className={cn(visibilityStyles[visibility], className)}
      tone="muted"
      {...props}
    >
      {formatVisibilityLabel(visibility)}
    </Badge>
  );
}
