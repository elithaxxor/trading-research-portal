import { Activity } from "lucide-react";

import { CardShell } from "@/components/card-shell";

type OpsEmptyStateProps = {
  description: string;
  title: string;
};

export function OpsEmptyState({ description, title }: OpsEmptyStateProps) {
  return (
    <CardShell padding="lg" tone="subtle">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-md border border-border bg-background text-gold-300">
          <Activity aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </CardShell>
  );
}
