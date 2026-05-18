"use client";

import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarkSeenSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
      disabled={pending}
      type="submit"
    >
      {pending ? "Marking..." : "Mark all as seen"}
    </button>
  );
}
