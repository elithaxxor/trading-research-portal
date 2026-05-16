import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CtaLink = {
  href: string;
  label: string;
};

type CTASectionProps = ComponentPropsWithoutRef<"section"> & {
  headline: string;
  description: string;
  primaryCta: CtaLink;
  secondaryCta?: CtaLink;
};

export function CTASection({
  className,
  description,
  headline,
  primaryCta,
  secondaryCta,
  ...props
}: CTASectionProps) {
  return (
    <section className={cn("py-12", className)} {...props}>
      <CardShell
        className="relative overflow-hidden border-primary/24 bg-primary/6"
        padding="lg"
        tone="elevated"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-balance text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {headline}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link
              className={cn(buttonVariants({ size: "lg" }))}
              href={primaryCta.href}
            >
              {primaryCta.label}
              <ArrowUpRight data-icon="inline-end" />
            </Link>
            {secondaryCta ? (
              <Link
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                href={secondaryCta.href}
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </CardShell>
    </section>
  );
}
