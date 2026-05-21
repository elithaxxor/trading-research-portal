import "server-only";

import { createSafePreviewText } from "@/lib/email/safety";

import {
  escapeEmailHtml,
  paragraph,
  pill,
  renderBaseEmailLayout,
} from "./base-layout";

export type NewIdeaEmailInput = {
  ideaUrl: string;
  preferenceUrl?: string | null;
  safePreview: string;
  ticker: string;
  title: string;
  unsubscribeUrl?: string | null;
  visibility: string;
};

export function renderNewIdeaEmail(input: NewIdeaEmailInput) {
  const previewText = createSafePreviewText(input.safePreview);
  const subject = `${input.ticker.toUpperCase()}: new ${input.visibility} research idea`;
  const body = `
    <h1>${escapeEmailHtml(input.title)}</h1>
    <p>${pill(input.ticker.toUpperCase())}${pill(input.visibility)}</p>
    ${paragraph(previewText)}
    ${paragraph(
      "Open the idea in the portal for the full protected research view available to your account."
    )}
  `;

  return renderBaseEmailLayout({
    body,
    ctaHref: input.ideaUrl,
    ctaLabel: "View idea",
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject,
    textBody: `${input.title}\n${input.ticker.toUpperCase()} · ${
      input.visibility
    }\n\n${previewText}\n\nOpen the protected idea page for details available to your account.`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
