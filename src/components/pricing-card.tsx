import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PricingCardProps = ComponentPropsWithoutRef<"div"> & {
  tier: string;
  price: string;
  description: string;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
  highlighted?: boolean;
  badgeLabel?: string;
};

export function PricingCard({
  badgeLabel = "Premium",
  className,
  ctaHref,
  ctaLabel,
  description,
  features,
  highlighted = false,
  price,
  tier,
  ...props
}: PricingCardProps) {
  return (
    <CardShell
      className={cn(
        "relative flex h-full flex-col gap-7 overflow-hidden",
        highlighted && "border-primary/40 bg-primary/8",
        className
      )}
      padding="lg"
      tone={highlighted ? "elevated" : "default"}
      {...props}
    >
      {highlighted ? (
        <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{tier}</h2>
          <p className="mt-3 font-mono text-sm uppercase tracking-[0.16em] text-primary">
            {price}
          </p>
        </div>
        {highlighted ? <Badge tone="gold">{badgeLabel}</Badge> : null}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      <ul className="grid gap-3">
        {features.map((feature) => (
          <li className="flex items-start gap-3 text-sm" key={feature}>
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-positive"
              aria-hidden
            />
            <span className="leading-6 text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        className={cn(
          "mt-auto",
          buttonVariants({
            variant: highlighted ? "default" : "outline",
            size: "lg",
          })
        )}
        href={ctaHref}
      >
        {ctaLabel}
      </Link>
    </CardShell>
  );
}
