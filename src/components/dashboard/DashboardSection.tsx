import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardSectionProps = {
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
  description?: string;
  title: string;
};

export function DashboardSection({
  actionHref,
  actionLabel,
  children,
  description,
  title,
}: DashboardSectionProps) {
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Link
            className={cn(
              "w-full sm:w-auto",
              buttonVariants({ size: "lg", variant: "outline" })
            )}
            href={actionHref}
          >
            {actionLabel}
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
