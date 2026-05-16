import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroCta = {
  href: string;
  label: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
};

type PageHeroProps = ComponentPropsWithoutRef<"section"> & {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: HeroCta[];
  align?: "left" | "center";
};

export function PageHero({
  actions = [],
  align = "left",
  className,
  description,
  eyebrow,
  title,
  ...props
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden py-16 sm:py-20",
        align === "center" && "text-center",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex max-w-4xl flex-col gap-6",
          align === "center" && "mx-auto items-center"
        )}
      >
        {eyebrow ? <Badge tone="gold">{eyebrow}</Badge> : null}
        <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="max-w-3xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        {actions.length > 0 ? (
          <div
            className={cn(
              "flex flex-col gap-3 sm:flex-row",
              align === "center" && "justify-center"
            )}
          >
            {actions.map((action, index) => (
              <Link
                className={cn(
                  buttonVariants({
                    variant: action.variant ?? (index === 0 ? "default" : "outline"),
                    size: "lg",
                  })
                )}
                href={action.href}
                key={action.href}
              >
                {action.label}
                {index === 0 ? <ArrowUpRight data-icon="inline-end" /> : null}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
