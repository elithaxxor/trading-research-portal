import type { ComponentPropsWithoutRef } from "react";
import { BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";

type ChartFallbackProps = ComponentPropsWithoutRef<"div"> & {
  description?: string;
  title?: string;
};

export function ChartFallback({
  className,
  description = "Check symbol metadata or try another chart.",
  title = "Chart unavailable",
  ...props
}: ChartFallbackProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-[360px] w-full min-w-0 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/24 p-6 text-center md:min-h-[420px]",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
        <BarChart3 aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
