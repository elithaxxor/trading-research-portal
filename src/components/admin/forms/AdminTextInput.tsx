import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type AdminTextInputProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

export function AdminTextInput({
  className,
  description,
  error,
  id,
  label,
  ...props
}: AdminTextInputProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className
        )}
        id={id}
        {...props}
      />
      {description ? (
        <span
          className="text-xs leading-5 text-muted-foreground"
          id={descriptionId}
        >
          {description}
        </span>
      ) : null}
      {error ? (
        <span className="text-xs leading-5 text-destructive" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
