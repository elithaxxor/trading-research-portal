import "server-only";

import { createSafePreviewText } from "@/lib/email/safety";

import {
  escapeEmailHtml,
  paragraph,
  pill,
  renderBaseEmailLayout,
} from "./base-layout";

export type ClosedReviewEmailInput = {
  ideaTitle: string;
  outcomeLabel?: string | null;
  preferenceUrl?: string | null;
  reviewUrl: string;
  safeSummary: string;
  ticker: string;
  unsubscribeUrl?: string | null;
  userCanAccessOutcome: boolean;
};

export function renderClosedReviewEmail(input: ClosedReviewEmailInput) {
  const previewText = createSafePreviewText(input.safeSummary);
  const outcome =
    input.userCanAccessOutcome && input.outcomeLabel
      ? pill(input.outcomeLabel)
      : "";
  const subject = `${input.ticker.toUpperCase()}: closed review available`;
  const body = `
    <h1>${escapeEmailHtml(input.ideaTitle)}</h1>
    <p>${pill(input.ticker.toUpperCase())}${pill("Closed review")}${outcome}</p>
    ${paragraph(previewText)}
    ${paragraph(
      "Open the protected review page for details available to your account."
    )}
  `;

  return renderBaseEmailLayout({
    body,
    ctaHref: input.reviewUrl,
    ctaLabel: "View closed review",
    footerNote:
      "Closed reviews are educational research reviews, not performance guarantees.",
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject,
    textBody: `${input.ideaTitle}\n${input.ticker.toUpperCase()} · Closed review${
      input.userCanAccessOutcome && input.outcomeLabel
        ? ` · ${input.outcomeLabel}`
        : ""
    }\n\n${previewText}`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
