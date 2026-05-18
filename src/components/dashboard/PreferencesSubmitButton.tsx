"use client";

import { useFormStatus } from "react-dom";
import { RotateCcw, Save } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreferencesSubmitButtonProps = {
  className?: string;
  intent?: "reset" | "save";
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function PreferencesSubmitButton({
  className,
  intent = "save",
  label,
  pendingLabel,
  variant = "default",
}: PreferencesSubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon = intent === "reset" ? RotateCcw : Save;

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant }), className)}
      disabled={pending}
      type="submit"
    >
      <Icon data-icon="inline-start" />
      {pending ? pendingLabel : label}
    </button>
  );
}
