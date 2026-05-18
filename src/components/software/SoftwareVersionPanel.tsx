import { CardShell } from "@/components/card-shell";
import { SoftwareAccessBadge } from "@/components/software/SoftwareAccessBadge";
import { formatSoftwareDeliveryType } from "@/lib/software/format";
import type { SoftwareProduct } from "@/lib/software/types";

type SoftwareVersionPanelProps = {
  product: SoftwareProduct;
};

export function SoftwareVersionPanel({ product }: SoftwareVersionPanelProps) {
  return (
    <CardShell padding="md" tone="subtle">
      <dl className="grid gap-4">
        <SoftwareVersionDetail label="Version" value={product.version} />
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Access tier
          </dt>
          <dd className="mt-2">
            <SoftwareAccessBadge accessTier={product.access_tier} kind="tier" />
          </dd>
        </div>
        <SoftwareVersionDetail
          label="Delivery"
          value={formatSoftwareDeliveryType(product.delivery_type)}
        />
        <SoftwareVersionDetail
          label="TradingView script"
          value={product.tradingview_script_name}
        />
        <SoftwareVersionDetail
          label="Published"
          value={formatSoftwareDate(product.published_at)}
        />
      </dl>
    </CardShell>
  );
}

function SoftwareVersionDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value ?? "Not listed"}</dd>
    </div>
  );
}

function formatSoftwareDate(value: string | null) {
  if (!value) {
    return "Not published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}
