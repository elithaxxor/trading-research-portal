import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = ComponentPropsWithoutRef<"div"> & {
  align?: "left" | "center";
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  align = "left",
  className,
  description,
  eyebrow,
  title,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow ? (
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
