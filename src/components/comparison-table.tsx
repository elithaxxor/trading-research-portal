import type { ComponentPropsWithoutRef } from "react";
import { CheckCircle2, MinusCircle } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { cn } from "@/lib/utils";

type ComparisonRow = {
  feature: string;
  free: string | boolean;
  premium: string | boolean;
};

type ComparisonTableProps = ComponentPropsWithoutRef<"div"> & {
  rows?: ComparisonRow[];
};

const defaultRows: ComparisonRow[] = [
  {
    feature: "Public market commentary",
    free: true,
    premium: true,
  },
  {
    feature: "Selected watchlist themes",
    free: true,
    premium: true,
  },
  {
    feature: "Detailed chart breakdowns",
    free: "Limited",
    premium: true,
  },
  {
    feature: "Risk-defined idea archive",
    free: false,
    premium: true,
  },
  {
    feature: "Member research dashboard",
    free: false,
    premium: true,
  },
];

export function ComparisonTable({
  className,
  rows = defaultRows,
  ...props
}: ComparisonTableProps) {
  return (
    <CardShell className={cn("overflow-hidden", className)} padding="none" {...props}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-5 py-4 font-medium text-foreground">Feature</th>
              <th className="px-5 py-4 font-medium text-foreground">Free</th>
              <th className="px-5 py-4 font-medium text-foreground">Premium</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-border last:border-b-0" key={row.feature}>
                <td className="px-5 py-4 text-foreground">{row.feature}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  <ComparisonValue value={row.free} />
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  <ComparisonValue value={row.premium} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}

function ComparisonValue({ value }: { value: string | boolean }) {
  if (typeof value === "string") {
    return <span>{value}</span>;
  }

  return value ? (
    <span className="inline-flex items-center gap-2 text-positive">
      <CheckCircle2 className="size-4" aria-hidden />
      Included
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <MinusCircle className="size-4" aria-hidden />
      Not included
    </span>
  );
}
