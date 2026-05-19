import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SoftwareLockedPanelProps = {
  message?: string;
  reason?: string;
};

export function SoftwareLockedPanel({
  message = "Software access is available to Premium and Pro members.",
  reason,
}: SoftwareLockedPanelProps) {
  return (
    <CardShell padding="lg" tone="elevated">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex size-12 items-center justify-center rounded-md border border-gold-400/25 bg-gold-400/10 text-gold-300">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Software locked
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {message}
          </p>
          {reason ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {reason}
            </p>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Software is educational research tooling. It is not financial
            advice, trade execution, or a guarantee of results.
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ size: "lg", variant: "default" }))}
          href="/pricing"
        >
          View access options
        </Link>
      </div>
    </CardShell>
  );
}
