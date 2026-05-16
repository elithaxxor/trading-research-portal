import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-md border px-2.5 py-1 font-mono text-[0.68rem] font-medium uppercase leading-none tracking-[0.16em]",
  {
    variants: {
      tone: {
        default: "border-border bg-secondary text-muted-foreground",
        gold: "border-primary/30 bg-primary/10 text-primary",
        positive: "border-positive/25 bg-positive/10 text-positive",
        muted: "border-border bg-card text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
);

type BadgeProps = ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
