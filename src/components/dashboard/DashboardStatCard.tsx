import type { LucideIcon } from "lucide-react";

import { CardShell } from "@/components/card-shell";

type DashboardStatCardProps = {
  description: string;
  icon?: LucideIcon;
  label: string;
  value: string;
};

export function DashboardStatCard({
  description,
  icon: Icon,
  label,
  value,
}: DashboardStatCardProps) {
  return (
    <CardShell padding="md" tone="elevated">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
          </div>
          {Icon ? (
            <div className="flex size-10 items-center justify-center rounded-md border border-gold-400/25 bg-gold-400/10 text-gold-300">
              <Icon aria-hidden="true" className="size-5" />
            </div>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </CardShell>
  );
}
