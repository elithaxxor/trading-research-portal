"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type AdminSubmitButtonProps = {
  className?: string;
  label?: string;
  pendingLabel?: string;
};

export function AdminSubmitButton({
  className,
  label = "Save",
  pendingLabel = "Saving...",
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button className={className} disabled={pending} size="lg" type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}
