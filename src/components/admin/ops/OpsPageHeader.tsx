import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type OpsPageHeaderProps = {
  actions?: ReactNode;
  description: string;
  title: string;
};

export function OpsPageHeader({
  actions,
  description,
  title,
}: OpsPageHeaderProps) {
  return (
    <AdminPageHeader
      actions={actions}
      breadcrumbs={[
        { href: "/admin", label: "Admin" },
        { href: "/admin/ops", label: "Operations" },
        { label: title },
      ]}
      description={description}
      eyebrow="Operations"
      title={title}
    />
  );
}
