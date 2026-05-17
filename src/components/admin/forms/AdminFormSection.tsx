import type { ReactNode } from "react";

import { CardShell } from "@/components/card-shell";

type AdminFormSectionProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

export function AdminFormSection({
  children,
  description,
  title,
}: AdminFormSectionProps) {
  return (
    <CardShell padding="lg" tone="elevated">
      <fieldset className="flex flex-col gap-6">
        <div className="space-y-2">
          <legend className="text-xl font-semibold text-foreground">
            {title}
          </legend>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="grid gap-5">{children}</div>
      </fieldset>
    </CardShell>
  );
}
