import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type AdminCheckboxProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "id" | "type"
> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

export function AdminCheckbox({
  className,
  description,
  error,
  id,
  label,
  ...props
}: AdminCheckboxProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-4"
        htmlFor={id}
      >
        <input
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error)}
          className={cn(
            "mt-1 size-4 rounded border border-input bg-background text-primary accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive",
            className
          )}
          id={id}
          type="checkbox"
          {...props}
        />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {description ? (
            <span
              className="text-xs leading-5 text-muted-foreground"
              id={descriptionId}
            >
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <span className="text-xs leading-5 text-destructive" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
