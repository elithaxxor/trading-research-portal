import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

type AdminShellProps = {
  adminEmail: string;
  adminName: string;
  children: ReactNode;
};

export function AdminShell({
  adminEmail,
  adminName,
  children,
}: AdminShellProps) {
  return (
    <div className="w-full min-w-0 max-w-full border-y border-border bg-background">
      <div className="mx-auto grid w-full min-w-0 max-w-full lg:min-h-[calc(100vh-8rem)] lg:max-w-7xl lg:grid-cols-[17rem_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="min-w-0 max-w-full">
          <AdminHeader adminEmail={adminEmail} adminName={adminName} />
          <main className="min-w-0 max-w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 rounded-lg border border-gold-400/25 bg-gold-400/10 px-4 py-3 text-sm leading-6 text-gold-100">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-gold-300"
                />
                <p>
                  Admin changes can affect public and member-facing research
                  pages.
                </p>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
