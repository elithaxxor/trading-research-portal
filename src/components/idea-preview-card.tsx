import type { ComponentPropsWithoutRef } from "react";

import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { cn } from "@/lib/utils";

type IdeaLevel = {
  label: string;
  value: string;
};

type IdeaPreviewCardProps = ComponentPropsWithoutRef<"div"> & {
  ticker?: string;
  bias?: string;
  status?: string;
  timeframe?: string;
  riskLevel?: string;
  thesis?: string;
  levels?: IdeaLevel[];
};

const defaultLevels = [
  { label: "Reference", value: "Prior range high" },
  { label: "Invalidation", value: "Close below support" },
  { label: "Review", value: "Next session update" },
];

export function IdeaPreviewCard({
  bias = "Constructive",
  className,
  levels = defaultLevels,
  riskLevel = "Moderate",
  status = "Research watch",
  thesis = "Educational example based on trend structure, volume context, and clearly defined invalidation.",
  ticker = "SPY",
  timeframe = "Swing",
  ...props
}: IdeaPreviewCardProps) {
  return (
    <CardShell
      className={cn("relative overflow-hidden", className)}
      padding="lg"
      tone="elevated"
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-market-line" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Example research card
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">
              {ticker}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold">{bias}</Badge>
            <Badge tone="muted">{status}</Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Timeframe" value={timeframe} />
          <Metric label="Risk level" value={riskLevel} />
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Thesis preview</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{thesis}</p>
        </div>

        <div className="grid gap-3">
          {levels.map((level) => (
            <div
              className="flex items-center justify-between gap-4 border-t border-border pt-3 text-sm"
              key={level.label}
            >
              <span className="text-muted-foreground">{level.label}</span>
              <span className="text-right font-medium text-foreground">
                {level.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/28 p-4">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
