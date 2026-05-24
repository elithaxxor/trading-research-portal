"use client";

import { useFormStatus } from "react-dom";

import { requestSoftwareAccessAction } from "@/app/dashboard/software/actions";
import { CardShell } from "@/components/card-shell";
import { SoftwareAccessBadge } from "@/components/software/SoftwareAccessBadge";
import { buttonVariants } from "@/components/ui/button";
import { captureAnalyticsEvent } from "@/lib/analytics/posthog-client";
import type {
  SoftwareAccessRequest,
  SoftwareDeliveryType,
} from "@/lib/software/types";

type SoftwareAccessRequestFormProps = {
  deliveryType: SoftwareDeliveryType;
  existingRequest: SoftwareAccessRequest | null;
  productId: string;
  slug: string;
};

export function SoftwareAccessRequestForm({
  deliveryType,
  existingRequest,
  productId,
  slug,
}: SoftwareAccessRequestFormProps) {
  const isManualRequest =
    deliveryType === "tradingview_invite_only" ||
    deliveryType === "manual_access";

  if (!isManualRequest) {
    return (
      <CardShell padding="md" tone="subtle">
        <p className="text-sm leading-6 text-muted-foreground">
          This product does not require a manual access request in Phase 8.
          Follow the documentation and setup notes on this page.
        </p>
      </CardShell>
    );
  }

  return (
    <CardShell padding="lg" tone="elevated">
      <div className="grid gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">
              Request access
            </h2>
            {existingRequest ? (
              <SoftwareAccessBadge
                kind="status"
                status={existingRequest.status}
              />
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            TradingView invite-only access may require manual approval. Phase 8
            records your request only; it does not automate TradingView
            permissions.
          </p>
        </div>

        <form action={requestSoftwareAccessAction} className="grid gap-5">
          <input name="software_product_id" type="hidden" value={productId} />
          <input name="slug" type="hidden" value={slug} />

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              TradingView username
            </span>
            <input
              className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
              defaultValue={existingRequest?.tradingview_username ?? ""}
              maxLength={80}
              name="tradingview_username"
              placeholder="your_tradingview_username"
              type="text"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              Request note
            </span>
            <textarea
              className="min-h-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
              defaultValue={existingRequest?.user_note ?? ""}
              maxLength={4000}
              name="user_note"
              placeholder="Optional context for manual approval."
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              Software is educational research tooling. It is not financial
              advice, trade execution, or a guarantee of results.
            </p>
            <SoftwareRequestSubmitButton
              existingRequest={Boolean(existingRequest)}
              label={existingRequest ? "Update request" : "Submit request"}
              slug={slug}
            />
          </div>
        </form>
      </div>
    </CardShell>
  );
}

function SoftwareRequestSubmitButton({
  existingRequest,
  label,
  slug,
}: {
  existingRequest: boolean;
  label: string;
  slug: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={buttonVariants({ size: "lg" })}
      disabled={pending}
      onClick={() => {
        if (!pending) {
          captureAnalyticsEvent("software_access_requested", {
            existing_request: existingRequest,
            path: `/dashboard/software/${slug}`,
          });
        }
      }}
      type="submit"
    >
      {pending ? "Submitting..." : label}
    </button>
  );
}
