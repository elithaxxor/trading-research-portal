import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { cn } from "@/lib/utils";

type DisclaimerBannerProps = ComponentPropsWithoutRef<"aside"> & {
  message?: string;
};

export function DisclaimerBanner({
  className,
  message = "Trading research is educational content, not financial advice. Markets involve uncertainty and the risk of loss.",
  ...props
}: DisclaimerBannerProps) {
  return (
    <aside className={cn("py-6", className)} {...props}>
      <CardShell
        className="flex flex-col gap-4 border-primary/24 bg-primary/6 sm:flex-row sm:items-center sm:justify-between"
        padding="md"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden
          />
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        <Link
          className="text-sm font-medium text-primary transition-colors hover:text-foreground"
          href="/disclaimer"
        >
          Read disclaimer
        </Link>
      </CardShell>
    </aside>
  );
}
