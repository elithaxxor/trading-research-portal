import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { SignOutSubmitButton } from "@/components/sign-out-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  adminEmail: string;
  adminName: string;
};

export function AdminHeader({ adminEmail, adminName }: AdminHeaderProps) {
  return (
    <header className="min-w-0 max-w-full border-b border-border bg-background/82 backdrop-blur">
      <div className="flex min-w-0 max-w-full flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Admin access
          </p>
          <div className="mt-1 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <p className="truncate text-base font-semibold text-foreground">
              {adminName}
            </p>
            {adminEmail ? (
              <p className="truncate text-sm text-muted-foreground">
                {adminEmail}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
            href="/"
          >
            <ArrowLeft data-icon="inline-start" />
            Public site
          </Link>
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href="/dashboard"
          >
            <LayoutDashboard data-icon="inline-start" />
            Dashboard
          </Link>
          <form action={signOutAction}>
            <SignOutSubmitButton size="sm" variant="outline" />
          </form>
        </div>
      </div>
    </header>
  );
}
