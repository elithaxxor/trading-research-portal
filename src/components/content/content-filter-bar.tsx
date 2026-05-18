import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { formatIdeaStatus, formatVisibilityLabel } from "@/lib/content/format";
import type {
  AssetClass,
  ContentVisibility,
  IdeaOutcome,
  IdeaPreviewSort,
  IdeaStatus,
} from "@/lib/content/types";
import { formatIdeaOutcome } from "@/lib/lifecycle/format";
import { cn } from "@/lib/utils";

type ContentFilterBarProps = ComponentPropsWithoutRef<"form"> & {
  action?: string;
  asset_class?: AssetClass | null;
  closed_reviews?: boolean;
  outcome?: IdeaOutcome | null;
  search?: string | null;
  searchPlaceholder?: string;
  showIdeaFilters?: boolean;
  sort?: IdeaPreviewSort | null;
  status?: IdeaStatus | null;
  updated_recently?: boolean;
  visibility?: ContentVisibility | null;
};

const assetClassOptions: { label: string; value: AssetClass }[] = [
  { label: "Stock", value: "stock" },
  { label: "ETF", value: "etf" },
  { label: "Option", value: "option" },
  { label: "Crypto", value: "crypto" },
  { label: "Forex", value: "forex" },
  { label: "Futures", value: "futures" },
  { label: "Index", value: "index" },
  { label: "Macro", value: "macro" },
  { label: "Other", value: "other" },
];

const statusOptions: IdeaStatus[] = [
  "watching",
  "active",
  "triggered",
  "invalidated",
  "target_hit",
  "closed",
];

const visibilityOptions: ContentVisibility[] = ["free", "premium", "pro"];

const outcomeOptions: IdeaOutcome[] = [
  "pending",
  "no_trade",
  "invalidated",
  "stopped_out",
  "target_1_hit",
  "target_2_hit",
  "target_3_hit",
  "partial_win",
  "win",
  "loss",
  "breakeven",
  "closed_manual",
];

const sortOptions: { label: string; value: IdeaPreviewSort }[] = [
  { label: "Newest published", value: "published" },
  { label: "Recently updated", value: "updated" },
  { label: "Last lifecycle event", value: "lifecycle" },
  { label: "Closed recently", value: "closed" },
];

export function ContentFilterBar({
  action,
  asset_class,
  className,
  closed_reviews = false,
  outcome,
  search,
  searchPlaceholder = "Search research, ticker, or setup",
  showIdeaFilters = true,
  sort = "published",
  status,
  updated_recently = false,
  visibility,
  ...props
}: ContentFilterBarProps) {
  return (
    <form
      action={action}
      className={cn(
        "grid gap-3 rounded-lg border border-border bg-card/72 p-4 backdrop-blur",
        showIdeaFilters
          ? "xl:grid-cols-[minmax(0,1fr)_repeat(5,minmax(8.5rem,0.32fr))_auto]"
          : "lg:grid-cols-[minmax(0,1fr)_minmax(9rem,0.35fr)_auto]",
        className
      )}
      method="get"
      {...props}
    >
      <label className="relative">
        <span className="sr-only">Search content</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          defaultValue={search ?? ""}
          name="q"
          placeholder={searchPlaceholder}
          type="search"
        />
      </label>

      {showIdeaFilters ? (
        <>
          <SelectField
            defaultValue={asset_class ?? ""}
            label="Asset class"
            name="asset_class"
          >
            <option value="">All assets</option>
            {assetClassOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <SelectField defaultValue={status ?? ""} label="Status" name="status">
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {formatIdeaStatus(option)}
              </option>
            ))}
          </SelectField>

          <SelectField
            defaultValue={outcome ?? ""}
            label="Outcome"
            name="outcome"
          >
            <option value="">All outcomes</option>
            {outcomeOptions.map((option) => (
              <option key={option} value={option}>
                {formatIdeaOutcome(option)}
              </option>
            ))}
          </SelectField>
        </>
      ) : null}

      <SelectField
        defaultValue={visibility ?? ""}
        label="Visibility"
        name="visibility"
      >
        <option value="">All access</option>
        {visibilityOptions.map((option) => (
          <option key={option} value={option}>
            {formatVisibilityLabel(option)}
          </option>
        ))}
      </SelectField>

      {showIdeaFilters ? (
        <SelectField defaultValue={sort ?? "published"} label="Sort" name="sort">
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      ) : null}

      {showIdeaFilters ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/24 px-3 py-2 text-sm text-muted-foreground sm:flex-row sm:items-center xl:col-span-full">
          <CheckboxField
            defaultChecked={updated_recently}
            label="Updated recently"
            name="updated_recently"
          />
          <CheckboxField
            defaultChecked={closed_reviews}
            label="Closed reviews"
            name="closed_reviews"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
        <Button className="w-full sm:w-auto" size="lg" type="submit">
          Apply
        </Button>
        {action ? (
          <Link
            className={cn(
              "w-full sm:w-auto",
              buttonVariants({ size: "lg", variant: "outline" })
            )}
            href={action}
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}

type CheckboxFieldProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
};

function CheckboxField({
  className,
  label,
  ...props
}: CheckboxFieldProps) {
  return (
    <label className="inline-flex items-center gap-2">
      <input
        className={cn(
          "size-4 rounded border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
          className
        )}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

type SelectFieldProps = ComponentPropsWithoutRef<"select"> & {
  label: string;
};

function SelectField({
  children,
  className,
  label,
  ...props
}: SelectFieldProps) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className={cn(
          "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
