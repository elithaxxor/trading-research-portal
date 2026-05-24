"use client";

import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import {
  type AnalyticsEventName,
  type SafeAnalyticsProperties,
} from "@/lib/analytics/events";
import { captureAnalyticsEvent } from "@/lib/analytics/posthog-client";
import { cn } from "@/lib/utils";

type PricingCheckoutSubmitButtonProps = {
  analyticsEventName?: AnalyticsEventName;
  analyticsProperties?: SafeAnalyticsProperties;
  className?: string;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
};

export function PricingCheckoutSubmitButton({
  analyticsEventName,
  analyticsProperties,
  className,
  label,
  pendingLabel = "Opening Stripe...",
  variant = "default",
}: PricingCheckoutSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={cn(buttonVariants({ size: "lg", variant }), className)}
      disabled={pending}
      onClick={() => {
        if (analyticsEventName && !pending) {
          captureAnalyticsEvent(analyticsEventName, analyticsProperties);
        }
      }}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
