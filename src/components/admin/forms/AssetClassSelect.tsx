import type { ComponentPropsWithoutRef } from "react";

import { assetClassValues } from "@/lib/admin/validation";

import { AdminSelect } from "./AdminSelect";

type AssetClassSelectProps = Omit<
  ComponentPropsWithoutRef<typeof AdminSelect>,
  "id" | "label" | "options"
> & {
  id?: string;
  label?: string;
};

function formatAssetClass(value: string) {
  return value === "etf"
    ? "ETF"
    : value.charAt(0).toUpperCase() + value.slice(1);
}

export function AssetClassSelect({
  id = "asset_class",
  label = "Asset class",
  placeholder = "Select asset class",
  ...props
}: AssetClassSelectProps) {
  return (
    <AdminSelect
      id={id}
      label={label}
      options={assetClassValues.map((value) => ({
        label: formatAssetClass(value),
        value,
      }))}
      placeholder={placeholder}
      {...props}
    />
  );
}
