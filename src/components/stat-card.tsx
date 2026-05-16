import type { ComponentPropsWithoutRef } from "react";

import { CardShell } from "@/components/card-shell";
import { cn } from "@/lib/utils";

type StatCardProps = ComponentPropsWithoutRef<"div"> & {
  label: string;
  value: string;
  description: string;
};

export function StatCard({
  className,
  description,
  label,
  value,
  ...props
}: StatCardProps) {
  return (
    <CardShell className={cn("h-full", className)} padding="md" {...props}>
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </CardShell>
  );
}
