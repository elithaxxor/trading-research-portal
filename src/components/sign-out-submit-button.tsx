"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignOutSubmitButtonProps = {
  className?: string;
  label?: string;
  pendingLabel?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "xs" | "sm" | "lg";
};

export function SignOutSubmitButton({
  className,
  label = "Sign out",
  pendingLabel = "Signing out...",
  size = "lg",
  variant = "outline",
}: SignOutSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      disabled={pending}
      type="submit"
    >
      <LogOut data-icon="inline-start" />
      {pending ? pendingLabel : label}
    </button>
  );
}
