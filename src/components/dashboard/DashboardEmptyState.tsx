import Link from "next/link";
import { Inbox } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  framed?: boolean;
  title: string;
};

export function DashboardEmptyState({
  actionHref,
  actionLabel,
  description,
  framed = true,
  title,
}: DashboardEmptyStateProps) {
  const content = (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-md border border-border bg-background text-gold-300">
        <Inbox aria-hidden="true" className="size-5" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );

  if (!framed) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary/25 p-5">
        {content}
      </div>
    );
  }

  return (
    <CardShell padding="lg" tone="subtle">
      {content}
    </CardShell>
  );
}
