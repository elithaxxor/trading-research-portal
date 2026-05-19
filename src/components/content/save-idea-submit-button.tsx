"use client";

import { useFormStatus } from "react-dom";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveIdeaSubmitButtonProps = {
  className?: string;
  icon?: "save" | "saved" | "trash";
  label: string;
  pendingLabel: string;
  size?: "default" | "xs" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
};

export function SaveIdeaSubmitButton({
  className,
  icon = "save",
  label,
  pendingLabel,
  size = "sm",
  variant = "outline",
}: SaveIdeaSubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon =
    icon === "trash" ? Trash2 : icon === "saved" ? BookmarkCheck : Bookmark;

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
