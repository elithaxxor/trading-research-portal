"use client";

import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PricingCheckoutSubmitButtonProps = {
  className?: string;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
};

export function PricingCheckoutSubmitButton({
  className,
  label,
  pendingLabel = "Opening Stripe...",
  variant = "default",
}: PricingCheckoutSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={cn(buttonVariants({ size: "lg", variant }), className)}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
