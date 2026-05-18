import type { ComponentPropsWithoutRef } from "react";

import { formatIdeaOutcome, getOutcomeTone } from "@/lib/lifecycle/format";
import type { IdeaOutcome, LifecycleTone } from "@/lib/lifecycle/types";
import { cn } from "@/lib/utils";

type OutcomeBadgeProps = ComponentPropsWithoutRef<"span"> & {
  outcome: IdeaOutcome;
};

const toneClasses: Record<LifecycleTone, string> = {
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  muted: "border-border bg-card text-muted-foreground",
  neutral: "border-border bg-secondary text-muted-foreground",
  success: "border-positive/30 bg-positive/10 text-positive",
  warning: "border-primary/30 bg-primary/10 text-primary",
};

export function OutcomeBadge({
  className,
  outcome,
  ...props
}: OutcomeBadgeProps) {
  return (
    <span
      aria-label={`Idea outcome: ${formatIdeaOutcome(outcome)}`}
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2.5 py-1 font-mono text-[0.68rem] font-medium uppercase leading-none tracking-[0.16em]",
        toneClasses[getOutcomeTone(outcome)],
        className
      )}
      {...props}
    >
      {formatIdeaOutcome(outcome)}
    </span>
  );
}
