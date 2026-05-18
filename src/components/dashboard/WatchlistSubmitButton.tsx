"use client";

import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WatchlistSubmitButtonProps = {
  className?: string;
  icon?: "add" | "edit" | "remove";
  label: string;
  pendingLabel: string;
  size?: "default" | "xs" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
};

export function WatchlistSubmitButton({
  className,
  icon = "add",
  label,
  pendingLabel,
  size = "sm",
  variant = "outline",
}: WatchlistSubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon = icon === "remove" ? Trash2 : icon === "edit" ? Pencil : Plus;

  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      disabled={pending}
      type="submit"
    >
      <Icon data-icon="inline-start" />
      {pending ? pendingLabel : label}
    </button>
  );
}
