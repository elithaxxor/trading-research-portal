import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { FileSearch } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = ComponentPropsWithoutRef<"section"> & {
  actionHref?: string;
  actionLabel?: string;
  description?: string;
  title?: string;
};

export function EmptyState({
  actionHref,
  actionLabel = "Reset filters",
  className,
  description = "No research matched the current filters. Try a broader search or reset the filters.",
  title = "No content found",
  ...props
}: EmptyStateProps) {
  return (
    <section className={className} {...props}>
      <CardShell className="text-center" padding="lg">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
          <FileSearch aria-hidden />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {actionHref ? (
          <Link
            className={cn(
              "mt-6",
              buttonVariants({ size: "lg", variant: "outline" })
            )}
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardShell>
    </section>
  );
}
