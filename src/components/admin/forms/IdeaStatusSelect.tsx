import type { ComponentPropsWithoutRef } from "react";

import { ideaStatusValues } from "@/lib/admin/validation";
import { formatIdeaStatus } from "@/lib/content/format";

import { AdminSelect } from "./AdminSelect";

type IdeaStatusSelectProps = Omit<
  ComponentPropsWithoutRef<typeof AdminSelect>,
  "id" | "label" | "options"
> & {
  id?: string;
  label?: string;
};

export function IdeaStatusSelect({
  id = "status",
  label = "Status",
  placeholder = "Select status",
  ...props
}: IdeaStatusSelectProps) {
  return (
    <AdminSelect
      id={id}
      label={label}
      options={ideaStatusValues.map((value) => ({
        label: formatIdeaStatus(value),
        value,
      }))}
      placeholder={placeholder}
      {...props}
    />
  );
}
