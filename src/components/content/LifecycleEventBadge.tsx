import type { ComponentPropsWithoutRef } from "react";

import { formatLifecycleEventType } from "@/lib/lifecycle/format";
import type { IdeaLifecycleEventType } from "@/lib/lifecycle/types";
import { cn } from "@/lib/utils";

type LifecycleEventBadgeProps = ComponentPropsWithoutRef<"span"> & {
  eventType: IdeaLifecycleEventType;
};

const eventToneClasses: Record<IdeaLifecycleEventType, string> = {
  activated: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  closed: "border-border bg-card text-muted-foreground",
  invalidated: "border-destructive/30 bg-destructive/10 text-destructive",
  note: "border-border bg-secondary text-muted-foreground",
  review_posted: "border-primary/30 bg-primary/10 text-primary",
  status_change: "border-border bg-secondary text-muted-foreground",
  target_hit: "border-positive/30 bg-positive/10 text-positive",
  triggered: "border-primary/30 bg-primary/10 text-primary",
};

export function LifecycleEventBadge({
  className,
  eventType,
  ...props
}: LifecycleEventBadgeProps) {
  return (
    <span
      aria-label={`Lifecycle event: ${formatLifecycleEventType(eventType)}`}
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2.5 py-1 font-mono text-[0.68rem] font-medium uppercase leading-none tracking-[0.16em]",
        eventToneClasses[eventType],
        className
      )}
      {...props}
    >
      {formatLifecycleEventType(eventType)}
    </span>
  );
}
