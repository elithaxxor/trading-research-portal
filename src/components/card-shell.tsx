import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardShellVariants = cva(
  "rounded-lg border border-border bg-card/72 shadow-[0_22px_70px_oklch(0.05_0.02_235_/_30%)] backdrop-blur",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        md: "p-5 sm:p-6",
        lg: "p-6 sm:p-8",
      },
      tone: {
        default: "",
        subtle: "bg-secondary/34",
        elevated: "bg-card/86 shadow-[0_30px_90px_oklch(0.04_0.02_235_/_42%)]",
      },
    },
    defaultVariants: {
      padding: "md",
      tone: "default",
    },
  }
);

type CardShellProps = ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof cardShellVariants>;

export function CardShell({ className, padding, tone, ...props }: CardShellProps) {
  return (
    <div
      className={cn(cardShellVariants({ padding, tone, className }))}
      {...props}
    />
  );
}
