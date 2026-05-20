import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

type DashboardShellProps = {
  accessLabel: string;
  accountTierLabel: string;
  children: ReactNode;
  statusLabel: string;
  workspaceLabel: string;
  userEmail: string;
};

export function DashboardShell({
  accessLabel,
  accountTierLabel,
  children,
  statusLabel,
  workspaceLabel,
  userEmail,
}: DashboardShellProps) {
  return (
    <div className="w-full min-w-0 max-w-full border-y border-border bg-background">
      <div className="mx-auto grid w-full min-w-0 max-w-full lg:min-h-[calc(100vh-8rem)] lg:max-w-7xl lg:grid-cols-[17rem_minmax(0,1fr)]">
        <DashboardSidebar tierLabel={workspaceLabel} />
        <div className="min-w-0 max-w-full">
          <DashboardHeader
            accessLabel={accessLabel}
            accountTierLabel={accountTierLabel}
            statusLabel={statusLabel}
            userEmail={userEmail}
          />
          <main className="min-w-0 max-w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm leading-6 text-muted-foreground">
              <div className="flex items-start gap-3">
                <Info
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-gold-300"
                />
                <p>
                  Dashboard data is personalized and RLS-aware. Locked research
                  and software details stay protected until your account has
                  access.
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
