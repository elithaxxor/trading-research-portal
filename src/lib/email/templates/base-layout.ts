import "server-only";

import { stripUnsafeHtml } from "@/lib/email/safety";

export type EmailTemplateOutput = {
  html: string;
  previewText: string;
  subject: string;
  text: string;
};

export type BaseLayoutInput = {
  body: string;
  ctaHref?: string | null;
  ctaLabel?: string | null;
  footerNote?: string | null;
  preferenceUrl?: string | null;
  previewText: string;
  subject: string;
  textBody: string;
  unsubscribeUrl?: string | null;
};

export function escapeEmailHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function paragraph(value: string | null | undefined) {
  const safeValue = escapeEmailHtml(stripUnsafeHtml(value));

  return safeValue ? `<p>${safeValue}</p>` : "";
}

export function pill(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return `<span class="pill">${escapeEmailHtml(value)}</span>`;
}

export function renderBaseEmailLayout(input: BaseLayoutInput): EmailTemplateOutput {
  const cta =
    input.ctaHref && input.ctaLabel
      ? `<a class="button" href="${escapeEmailHtml(input.ctaHref)}">${escapeEmailHtml(
          input.ctaLabel
        )}</a>`
      : "";
  const preferenceLink = input.preferenceUrl
    ? `<a href="${escapeEmailHtml(input.preferenceUrl)}">Manage preferences</a>`
    : "Manage preferences in your account.";
  const unsubscribeLink = input.unsubscribeUrl
    ? ` · <a href="${escapeEmailHtml(input.unsubscribeUrl)}">Unsubscribe</a>`
    : "";
  const footerNote = input.footerNote ? paragraph(input.footerNote) : "";
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeEmailHtml(input.subject)}</title>
    <style>
      body { margin: 0; background: #0f172a; color: #e5e7eb; font-family: Arial, sans-serif; }
      .wrapper { width: 100%; background: #0f172a; padding: 32px 12px; }
      .container { max-width: 640px; margin: 0 auto; background: #111827; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
      .header { padding: 24px; border-bottom: 1px solid #334155; }
      .brand { color: #f8fafc; font-size: 18px; font-weight: 700; letter-spacing: 0; margin: 0; }
      .preview { display: none; max-height: 0; overflow: hidden; opacity: 0; }
      .content { padding: 24px; font-size: 15px; line-height: 1.65; }
      h1 { color: #f8fafc; font-size: 24px; line-height: 1.25; margin: 0 0 16px; }
      h2 { color: #f8fafc; font-size: 18px; margin: 24px 0 8px; }
      p { margin: 0 0 16px; }
      a { color: #93c5fd; }
      .button { display: inline-block; background: #f8fafc; color: #0f172a; padding: 12px 16px; border-radius: 6px; text-decoration: none; font-weight: 700; margin: 8px 0 18px; }
      .pill { display: inline-block; border: 1px solid #475569; color: #cbd5e1; border-radius: 999px; padding: 3px 9px; font-size: 12px; margin: 0 6px 8px 0; }
      .item { border-top: 1px solid #334155; padding-top: 14px; margin-top: 14px; }
      .footer { color: #94a3b8; font-size: 12px; line-height: 1.55; padding: 20px 24px 24px; border-top: 1px solid #334155; }
    </style>
  </head>
  <body>
    <div class="preview">${escapeEmailHtml(input.previewText)}</div>
    <div class="wrapper">
      <div class="container">
        <div class="header"><p class="brand">Trading Research Portal</p></div>
        <div class="content">
          ${input.body}
          ${cta}
        </div>
        <div class="footer">
          ${footerNote}
          <p>Trading research and software are educational research tooling. They are not financial advice, trade execution, or a guarantee of results.</p>
          <p>${preferenceLink}${unsubscribeLink}</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
  const text = [
    "Trading Research Portal",
    "",
    input.textBody,
    "",
    input.ctaHref && input.ctaLabel
      ? `${input.ctaLabel}: ${input.ctaHref}`
      : null,
    input.footerNote ?? null,
    "Trading research and software are educational research tooling. They are not financial advice, trade execution, or a guarantee of results.",
    input.preferenceUrl ? `Manage preferences: ${input.preferenceUrl}` : null,
    input.unsubscribeUrl ? `Unsubscribe: ${input.unsubscribeUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    html,
    previewText: input.previewText,
    subject: input.subject,
    text,
  };
}
