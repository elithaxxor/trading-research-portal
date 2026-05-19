import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { SoftwareAccessBadge } from "@/components/software/SoftwareAccessBadge";
import type {
  SoftwareAccessRequestStatus,
  SoftwareProductPreview,
} from "@/lib/software/types";
import { cn } from "@/lib/utils";

type SoftwareCardProps = {
  product: SoftwareProductPreview;
  requestStatus?: SoftwareAccessRequestStatus | null;
};

export function SoftwareCard({ product, requestStatus }: SoftwareCardProps) {
  return (
    <Link className="group block h-full" href={`/dashboard/software/${product.slug}`}>
      <CardShell
        className="flex h-full flex-col gap-5 transition-colors group-hover:border-gold-400/35 group-hover:bg-card"
        padding="md"
        tone="elevated"
      >
        <div className="flex flex-wrap gap-2">
          <SoftwareAccessBadge accessTier={product.access_tier} kind="tier" />
          <SoftwareAccessBadge kind="type" softwareType={product.software_type} />
          {requestStatus ? (
            <SoftwareAccessBadge kind="status" status={requestStatus} />
          ) : null}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground transition group-hover:text-primary">
            {product.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {product.short_description ??
              "Software documentation and manual access details."}
          </p>
        </div>

        <dl className="mt-auto grid gap-3 text-sm sm:grid-cols-2">
          <SoftwareCardDetail
            label="Delivery"
            value={<SoftwareAccessBadge deliveryType={product.delivery_type} kind="delivery" />}
          />
          <SoftwareCardDetail
            label="Version"
            value={product.version ?? "Not listed"}
          />
          <SoftwareCardDetail
            label="Published"
            value={formatSoftwareDate(product.published_at)}
          />
          <SoftwareCardDetail
            label="Open"
            value={
              <span className="inline-flex items-center gap-1 text-primary">
                Details
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </span>
            }
          />
        </dl>
      </CardShell>
    </Link>
  );
}

function SoftwareCardDetail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("mt-1 text-sm text-foreground")}>{value}</dd>
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
