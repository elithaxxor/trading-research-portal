import type { ComponentPropsWithoutRef } from "react";

import { ideaBiasValues } from "@/lib/admin/validation";
import { formatBias } from "@/lib/content/format";

import { AdminSelect } from "./AdminSelect";

type IdeaBiasSelectProps = Omit<
  ComponentPropsWithoutRef<typeof AdminSelect>,
  "id" | "label" | "options"
> & {
  id?: string;
  label?: string;
};

export function IdeaBiasSelect({
  id = "bias",
  label = "Bias",
  placeholder = "Select bias",
  ...props
}: IdeaBiasSelectProps) {
  return (
    <AdminSelect
      id={id}
      label={label}
      options={ideaBiasValues.map((value) => ({
        label: formatBias(value),
        value,
      }))}
      placeholder={placeholder}
      {...props}
    />
  );
}
