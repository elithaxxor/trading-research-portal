import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile, user } = await requireAdmin("/admin");
  const adminEmail = profile.email ?? user.email ?? "";
  const adminName = profile.full_name ?? adminEmail ?? "Admin";

  return (
    <AdminShell adminEmail={adminEmail} adminName={adminName}>
      {children}
    </AdminShell>
  );
}
