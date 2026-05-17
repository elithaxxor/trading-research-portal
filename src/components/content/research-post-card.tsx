import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/content/format";
import type { ContentVisibility } from "@/lib/content/types";
import { cn } from "@/lib/utils";

import { VisibilityBadge } from "./visibility-badge";

type ResearchPostCardProps = ComponentPropsWithoutRef<"article"> & {
  excerpt: string | null;
  is_locked: boolean;
  lockedCtaHref?: string;
  lockedCtaLabel?: string;
  published_at: string | null;
  slug: string;
  title: string;
  visibility: ContentVisibility;
};

export function ResearchPostCard({
  className,
  excerpt,
  is_locked,
  lockedCtaHref,
  lockedCtaLabel = "View access options",
  published_at,
  slug,
  title,
  visibility,
  ...props
}: ResearchPostCardProps) {
  const href = `/research/${slug}`;
  const ctaHref = is_locked ? lockedCtaHref ?? href : href;
  const ctaLabel = is_locked ? lockedCtaLabel : "Read note";

  return (
    <article className={className} {...props}>
      <CardShell
        className={cn(
          "flex h-full flex-col gap-6",
          is_locked && "border-primary/35 bg-primary/6"
        )}
        padding="lg"
        tone={is_locked ? "elevated" : "default"}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <VisibilityBadge visibility={visibility} />
              {is_locked ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[0.68rem] font-medium uppercase leading-none tracking-[0.16em] text-primary">
                  <LockKeyhole aria-hidden />
                  Locked
                </span>
              ) : null}
            </div>
            <h2 className="text-balance text-2xl font-semibold text-foreground">
              <Link
                className="outline-none transition-colors hover:text-primary focus-visible:text-primary"
                href={href}
              >
                {title}
              </Link>
            </h2>
          </div>

          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {formatDate(published_at)}
          </p>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {excerpt ??
            "A public-safe research preview is being prepared for this note."}
        </p>

        {is_locked ? (
          <p className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Full research details are protected by member access.
          </p>
        ) : null}

        <Link
          className={cn(
            "mt-auto w-full sm:w-fit",
            buttonVariants({
              size: "lg",
              variant: is_locked ? "outline" : "default",
            })
          )}
          href={ctaHref}
        >
          {ctaLabel}
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </CardShell>
    </article>
  );
}
