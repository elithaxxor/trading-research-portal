import "server-only";

import { createSafePreviewText } from "@/lib/email/safety";

import {
  escapeEmailHtml,
  paragraph,
  pill,
  renderBaseEmailLayout,
} from "./base-layout";

export type IdeaUpdateEmailInput = {
  ideaTitle: string;
  ideaUrl: string;
  preferenceUrl?: string | null;
  safeSummary: string;
  ticker: string;
  unsubscribeUrl?: string | null;
  updateTitle: string;
};

export function renderIdeaUpdateEmail(input: IdeaUpdateEmailInput) {
  const previewText = createSafePreviewText(input.safeSummary);
  const subject = `${input.ticker.toUpperCase()}: idea update`;
  const body = `
    <h1>${escapeEmailHtml(input.updateTitle)}</h1>
    <p>${pill(input.ticker.toUpperCase())}${pill("Idea update")}</p>
    ${paragraph(input.ideaTitle)}
    ${paragraph(previewText)}
    ${paragraph(
      "The full update is available in the protected portal view according to your account access."
    )}
  `;

  return renderBaseEmailLayout({
    body,
    ctaHref: input.ideaUrl,
    ctaLabel: "View update",
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject,
    textBody: `${input.updateTitle}\n${input.ideaTitle}\n${input.ticker.toUpperCase()}\n\n${previewText}`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
