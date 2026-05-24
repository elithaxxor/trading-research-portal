"use client";

import { useFormStatus } from "react-dom";
import { RotateCcw, Save } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  type AnalyticsEventName,
  type SafeAnalyticsProperties,
} from "@/lib/analytics/events";
import { captureAnalyticsEvent } from "@/lib/analytics/posthog-client";
import { cn } from "@/lib/utils";

type PreferencesSubmitButtonProps = {
  analyticsEventName?: AnalyticsEventName;
  analyticsProperties?: SafeAnalyticsProperties;
  className?: string;
  intent?: "reset" | "save";
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function PreferencesSubmitButton({
  analyticsEventName,
  analyticsProperties,
  className,
  intent = "save",
  label,
  pendingLabel,
  variant = "default",
}: PreferencesSubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon = intent === "reset" ? RotateCcw : Save;

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant }), className)}
      disabled={pending}
      onClick={() => {
        if (analyticsEventName && !pending) {
          captureAnalyticsEvent(analyticsEventName, analyticsProperties);
        }
      }}
      type="submit"
    >
      <Icon data-icon="inline-start" />
      {pending ? pendingLabel : label}
    </button>
  );
}
