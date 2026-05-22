import "server-only";

import {
  escapeEmailHtml,
  paragraph,
  pill,
  renderBaseEmailLayout,
} from "./base-layout";

export type BillingAccessStatusEmailInput = {
  accountBillingUrl: string;
  accessSummary: string;
  billingStatus: string;
  preferenceUrl?: string | null;
  tierLabel: string;
  unsubscribeUrl?: string | null;
};

export function renderBillingAccessStatusEmail(
  input: BillingAccessStatusEmailInput
) {
  const previewText = `Your account access is now ${input.tierLabel} with billing status ${input.billingStatus}.`;
  const body = `
    <h1>Account access update</h1>
    <p>${pill(input.tierLabel)}${pill(input.billingStatus)}</p>
    ${paragraph(input.accessSummary)}
    ${paragraph(
      "Stripe handles receipts and payment emails unless that is explicitly changed later."
    )}
    ${paragraph("This email does not include card details or receipts.")}
  `;

  return renderBaseEmailLayout({
    body,
    ctaHref: input.accountBillingUrl,
    ctaLabel: "View account billing",
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject: `Account access update: ${escapeEmailHtml(input.tierLabel)}`,
    textBody: `Account access update\nTier: ${input.tierLabel}\nBilling status: ${input.billingStatus}\n\n${input.accessSummary}\n\nStripe handles receipts and payment emails. This email does not include card details or receipts.`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
