"use client";

import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingPortalSubmitButtonProps = {
  className?: string;
  label?: string;
};

export function BillingPortalSubmitButton({
  className,
  label = "Manage Billing",
}: BillingPortalSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={cn(buttonVariants({ size: "lg", variant: "default" }), className)}
      disabled={pending}
      type="submit"
    >
      {pending ? "Opening portal..." : label}
    </button>
  );
}
