import "server-only";

import { createSafePreviewText } from "@/lib/email/safety";

import {
  escapeEmailHtml,
  paragraph,
  renderBaseEmailLayout,
} from "./base-layout";

export type WeeklyDigestItem = {
  href: string;
  label?: string | null;
  preview: string;
  title: string;
};

export type WeeklyDigestEmailInput = {
  closedReviews?: WeeklyDigestItem[];
  lifecycleUpdates?: WeeklyDigestItem[];
  majorUpdates?: WeeklyDigestItem[];
  newIdeas?: WeeklyDigestItem[];
  newResearchPosts?: WeeklyDigestItem[];
  preferenceUrl?: string | null;
  softwareUpdates?: WeeklyDigestItem[];
  unsubscribeUrl?: string | null;
  userCanAccessSoftwareUpdates?: boolean;
  weekLabel: string;
};

function renderItems(items: WeeklyDigestItem[] | undefined) {
  if (!items?.length) {
    return paragraph("Nothing new in this section.");
  }

  return items
    .map((item) => {
      const preview = createSafePreviewText(item.preview, 140);

      return `<div class="item">
        <p><strong>${escapeEmailHtml(item.title)}</strong>${
          item.label ? ` · ${escapeEmailHtml(item.label)}` : ""
        }</p>
        ${paragraph(preview)}
        <p><a href="${escapeEmailHtml(item.href)}">Open in portal</a></p>
      </div>`;
    })
    .join("");
}

function textItems(items: WeeklyDigestItem[] | undefined) {
  if (!items?.length) {
    return "- Nothing new";
  }

  return items
    .map(
      (item) =>
        `- ${item.title}${item.label ? ` · ${item.label}` : ""}\n  ${createSafePreviewText(
          item.preview,
          140
        )}\n  ${item.href}`
    )
    .join("\n");
}

export function renderWeeklyDigestEmail(input: WeeklyDigestEmailInput) {
  const subject = `Weekly research digest: ${input.weekLabel}`;
  const previewText = "Your weekly safe summary of research portal updates.";
  const softwareSection = input.userCanAccessSoftwareUpdates
    ? `<h2>Software Updates</h2>${renderItems(input.softwareUpdates)}`
    : "";
  const body = `
    <h1>${escapeEmailHtml(input.weekLabel)}</h1>
    ${paragraph(
      "Here is a safe summary of portal activity. Open linked pages for protected details available to your account."
    )}
    <h2>New Ideas</h2>
    ${renderItems(input.newIdeas)}
    <h2>New Research Posts</h2>
    ${renderItems(input.newResearchPosts)}
    <h2>Major Updates</h2>
    ${renderItems(input.majorUpdates)}
    <h2>Lifecycle Updates</h2>
    ${renderItems(input.lifecycleUpdates)}
    <h2>Closed Reviews</h2>
    ${renderItems(input.closedReviews)}
    ${softwareSection}
  `;
  const softwareText = input.userCanAccessSoftwareUpdates
    ? `\n\nSoftware Updates\n${textItems(input.softwareUpdates)}`
    : "";

  return renderBaseEmailLayout({
    body,
    preferenceUrl: input.preferenceUrl,
    previewText,
    subject,
    textBody: `Weekly research digest: ${input.weekLabel}\n\nNew Ideas\n${textItems(
      input.newIdeas
    )}\n\nNew Research Posts\n${textItems(
      input.newResearchPosts
    )}\n\nMajor Updates\n${textItems(
      input.majorUpdates
    )}\n\nLifecycle Updates\n${textItems(
      input.lifecycleUpdates
    )}\n\nClosed Reviews\n${textItems(input.closedReviews)}${softwareText}`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
