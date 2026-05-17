import type { ComponentPropsWithoutRef } from "react";

import { formatVisibilityLabel } from "@/lib/content/format";
import { contentVisibilityValues } from "@/lib/admin/validation";

import { AdminSelect } from "./AdminSelect";

type VisibilitySelectProps = Omit<
  ComponentPropsWithoutRef<typeof AdminSelect>,
  "id" | "label" | "options"
> & {
  id?: string;
  label?: string;
};

export function VisibilitySelect({
  id = "visibility",
  label = "Visibility",
  placeholder = "Select visibility",
  ...props
}: VisibilitySelectProps) {
  return (
    <AdminSelect
      id={id}
      label={label}
      options={contentVisibilityValues.map((value) => ({
        label: formatVisibilityLabel(value),
        value,
      }))}
      placeholder={placeholder}
      {...props}
    />
  );
}
