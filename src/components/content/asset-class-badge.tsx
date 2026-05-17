import type { ComponentPropsWithoutRef } from "react";

import { Badge } from "@/components/badge";
import type { AssetClass } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type AssetClassBadgeProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  assetClass: AssetClass;
};

const assetClassLabels: Record<AssetClass, string> = {
  crypto: "Crypto",
  etf: "ETF",
  forex: "Forex",
  futures: "Futures",
  index: "Index",
  macro: "Macro",
  option: "Option",
  other: "Other",
  stock: "Stock",
};

export function AssetClassBadge({
  assetClass,
  className,
  ...props
}: AssetClassBadgeProps) {
  return (
    <Badge
      aria-label={`Asset class: ${assetClassLabels[assetClass]}`}
      className={cn("border-accent/25 bg-accent/8 text-accent", className)}
      tone="muted"
      {...props}
    >
      {assetClassLabels[assetClass]}
    </Badge>
  );
}
