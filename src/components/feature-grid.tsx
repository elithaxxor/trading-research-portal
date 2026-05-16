import type { ComponentPropsWithoutRef } from "react";
import type { LucideIcon } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { cn } from "@/lib/utils";

export type FeatureGridItem = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

type FeatureGridProps = ComponentPropsWithoutRef<"section"> & {
  items: FeatureGridItem[];
  columns?: 2 | 3;
};

export function FeatureGrid({
  className,
  columns = 3,
  items,
  ...props
}: FeatureGridProps) {
  return (
    <section
      className={cn(
        "grid gap-5",
        columns === 2 ? "lg:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <CardShell className="min-h-48" key={item.title} padding="lg">
            {Icon ? <Icon className="size-5 text-primary" aria-hidden /> : null}
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </CardShell>
        );
      })}
    </section>
  );
}
