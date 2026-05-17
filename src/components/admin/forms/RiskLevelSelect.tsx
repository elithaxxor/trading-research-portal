import type { ComponentPropsWithoutRef } from "react";

import { riskLevelValues } from "@/lib/admin/validation";
import { formatRiskLevel } from "@/lib/content/format";

import { AdminSelect } from "./AdminSelect";

type RiskLevelSelectProps = Omit<
  ComponentPropsWithoutRef<typeof AdminSelect>,
  "id" | "label" | "options"
> & {
  id?: string;
  label?: string;
};

export function RiskLevelSelect({
  id = "risk_level",
  label = "Risk level",
  placeholder = "Select risk level",
  ...props
}: RiskLevelSelectProps) {
  return (
    <AdminSelect
      id={id}
      label={label}
      options={riskLevelValues.map((value) => ({
        label: formatRiskLevel(value),
        value,
      }))}
      placeholder={placeholder}
      {...props}
    />
  );
}
