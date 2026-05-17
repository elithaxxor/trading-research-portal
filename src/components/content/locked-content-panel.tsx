import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { formatVisibilityLabel } from "@/lib/content/format";
import type { ContentVisibility } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type LockedContentPanelProps = ComponentPropsWithoutRef<"aside"> & {
  ctaHref: string;
  ctaLabel: string;
  description?: string;
  title?: string;
  visibility: Exclude<ContentVisibility, "free"> | ContentVisibility;
};

function getDefaultDescription(visibility: ContentVisibility) {
  if (visibility === "pro") {
    return "This research is available to Pro members.";
  }

  if (visibility === "premium") {
    return "This research is available to Premium members.";
  }

  return "This research is available to members.";
}

export function LockedContentPanel({
  className,
  ctaHref,
  ctaLabel,
  description,
  title,
  visibility,
  ...props
}: LockedContentPanelProps) {
  return (
    <aside
      aria-label={`${formatVisibilityLabel(visibility)} locked research`}
      className={className}
      role="region"
      {...props}
    >
      <CardShell
        className="overflow-hidden focus-within:ring-2 focus-within:ring-primary/40"
        padding="lg"
        tone="elevated"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <LockKeyhole aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                {formatVisibilityLabel(visibility)} research
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {title ?? "Member-only research"}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {description ?? getDefaultDescription(visibility)}
              </p>
            </div>
          </div>

          <Link
            className={cn(
              "w-full sm:w-auto",
              buttonVariants({ size: "lg", variant: "outline" })
            )}
            href={ctaHref}
          >
            {ctaLabel}
          </Link>
        </div>
      </CardShell>
    </aside>
  );
}
