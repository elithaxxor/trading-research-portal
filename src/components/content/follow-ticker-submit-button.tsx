"use client";

import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FollowTickerSubmitButtonProps = {
  className?: string;
  icon?: "follow" | "followed" | "unfollow";
  label: string;
  pendingLabel: string;
  size?: "default" | "xs" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
};

export function FollowTickerSubmitButton({
  className,
  icon = "follow",
  label,
  pendingLabel,
  size = "sm",
  variant = "outline",
}: FollowTickerSubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon =
    icon === "unfollow" ? EyeOff : icon === "followed" ? Pencil : Eye;

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
