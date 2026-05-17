import type { ComponentPropsWithoutRef } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthNoticeTone = "error" | "success" | "info";

type AuthNoticeProps = ComponentPropsWithoutRef<"p"> & {
  message: string;
  tone?: AuthNoticeTone;
};

const toneClasses: Record<AuthNoticeTone, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-border bg-secondary/35 text-muted-foreground",
  success: "border-positive/30 bg-positive/10 text-positive",
};

const toneIcons = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
};

export function AuthNotice({
  className,
  message,
  tone = "info",
  ...props
}: AuthNoticeProps) {
  const Icon = toneIcons[tone];

  return (
    <p
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-6",
        toneClasses[tone],
        className
      )}
      role={tone === "error" ? "alert" : "status"}
      {...props}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
