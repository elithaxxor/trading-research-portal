import "server-only";

import { createSafePreviewText } from "@/lib/email/safety";

import {
  escapeEmailHtml,
  paragraph,
  pill,
  renderBaseEmailLayout,
} from "./base-layout";

export type SoftwareAccessStatusEmailInput = {
  adminNote?: string | null;
  instructions?: string | null;
  preferenceUrl?: string | null;
  productTitle: string;
  requestUrl: string;
  status: string;
  tradingViewUsername?: string | null;
  unsubscribeUrl?: string | null;
};

export function renderSoftwareAccessStatusEmail(
  input: SoftwareAccessStatusEmailInput
) {
  const safeInstructions =
    input.status === "granted"
      ? createSafePreviewText(input.instructions, 220)
      : "";
  const safeAdminNote = createSafePreviewText(input.adminNote, 220);
  const previewText = `${input.productTitle} access request status: ${input.status}.`;
  const body = `
    <h1>${escapeEmailHtml(input.productTitle)}</h1>
    <p>${pill("Software access")}${pill(input.status)}</p>
    ${
      input.tradingViewUsername
        ? paragraph(`TradingView username: ${input.tradingViewUsername}`)
        : ""
    }
    ${safeAdminNote ? paragraph(`Admin note: ${safeAdminNote}`) : ""}
    ${safeInstructions ? paragraph(safeInstructions) : ""}
    ${paragraph(
      "TradingView invite-only access may require manual approval outside this portal."
    )}
    ${paragraph("Private implementation files are never sent by email.")}
  `;

  return renderBaseEmailLayout({
    body,
    ctaHref: input.requestUrl,
    ctaLabel: "View software request",
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject: `${input.productTitle}: access request ${input.status}`,
    textBody: `${input.productTitle}\nStatus: ${input.status}${
      input.tradingViewUsername
        ? `\nTradingView username: ${input.tradingViewUsername}`
        : ""
    }${safeAdminNote ? `\nAdmin note: ${safeAdminNote}` : ""}${
      safeInstructions ? `\n\n${safeInstructions}` : ""
    }\n\nTradingView invite-only access may require manual approval outside this portal. Private implementation files are never sent by email.`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
