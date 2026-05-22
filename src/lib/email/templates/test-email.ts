import "server-only";

import { paragraph, renderBaseEmailLayout } from "./base-layout";

export type TestEmailInput = {
  dashboardUrl: string;
  preferenceUrl?: string | null;
};

export function renderTestEmail(input: TestEmailInput) {
  const previewText = "This is a Trading Research Portal test email.";
  const body = `
    <h1>Test email</h1>
    ${paragraph(
      "This confirms the Phase 10 email rendering path is working. No research, billing, software, or private account details are included."
    )}
  `;

  return renderBaseEmailLayout({
    body,
    ctaHref: input.dashboardUrl,
    ctaLabel: "Open dashboard",
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject: "Trading Research Portal test email",
    textBody:
      "This confirms the Phase 10 email rendering path is working. No research, billing, software, or private account details are included.",
  });
}
