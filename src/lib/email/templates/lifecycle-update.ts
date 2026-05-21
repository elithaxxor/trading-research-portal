import "server-only";

import { createSafePreviewText } from "@/lib/email/safety";

import {
  escapeEmailHtml,
  paragraph,
  pill,
  renderBaseEmailLayout,
} from "./base-layout";

export type LifecycleUpdateEmailInput = {
  eventLabel: string;
  ideaTitle: string;
  ideaUrl: string;
  preferenceUrl?: string | null;
  safeSummary: string;
  statusLabel: string;
  ticker: string;
  unsubscribeUrl?: string | null;
};

export function renderLifecycleUpdateEmail(input: LifecycleUpdateEmailInput) {
  const previewText = createSafePreviewText(input.safeSummary);
  const subject = `${input.ticker.toUpperCase()}: ${input.eventLabel}`;
  const body = `
    <h1>${escapeEmailHtml(input.eventLabel)}</h1>
    <p>${pill(input.ticker.toUpperCase())}${pill(input.statusLabel)}</p>
    ${paragraph(input.ideaTitle)}
    ${paragraph(previewText)}
    ${paragraph(
      "This lifecycle note is educational research context only, not trade instruction or execution."
    )}
  `;

  return renderBaseEmailLayout({
    body,
    ctaHref: input.ideaUrl,
    ctaLabel: "View lifecycle update",
    footerNote:
      "Lifecycle updates are educational-only research notes and may not reflect your personal risk tolerance.",
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject,
    textBody: `${input.eventLabel}\n${input.ideaTitle}\n${input.ticker.toUpperCase()} · ${
      input.statusLabel
    }\n\n${previewText}`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
