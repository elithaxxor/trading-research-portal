"use client";

import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminSoftwareRequestStatusButtonProps = {
  destructive?: boolean;
  label: string;
  value: string;
};

export function AdminSoftwareRequestStatusButton({
  destructive = false,
  label,
  value,
}: AdminSoftwareRequestStatusButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={cn(
        buttonVariants({
          size: "xs",
          variant: destructive ? "destructive" : "outline",
        })
      )}
      disabled={pending}
      name="status"
      type="submit"
      value={value}
    >
      {pending ? "Updating..." : label}
    </button>
  );
}
