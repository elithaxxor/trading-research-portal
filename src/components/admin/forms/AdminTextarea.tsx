import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type AdminTextareaProps = Omit<ComponentPropsWithoutRef<"textarea">, "id"> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

export function AdminTextarea({
  className,
  description,
  error,
  id,
  label,
  ...props
}: AdminTextareaProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-32 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
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
