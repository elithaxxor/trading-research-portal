import "server-only";

import { ServerClient } from "postmark";

import { getEffectiveRecipientEmail, requireEmailSendConfig } from "./config";
import type { EmailProvider, EmailSendInput } from "./types";

let postmarkClient: ServerClient | null = null;

function getPostmarkClient() {
  const config = requireEmailSendConfig();

  if (!postmarkClient) {
    postmarkClient = new ServerClient(config.postmarkServerToken);
  }

  return postmarkClient;
}

function formatRecipient(
  recipient: string | { email: string; name?: string | null },
  category: EmailSendInput["category"]
) {
  if (typeof recipient === "string") {
    return getEffectiveRecipientEmail(recipient, category);
  }

  const email = getEffectiveRecipientEmail(recipient.email, category);

  return recipient.name ? `${recipient.name} <${email}>` : email;
}

function normalizeRecipients(
  input: EmailSendInput["to"],
  category: EmailSendInput["category"]
) {
  const recipients = Array.isArray(input) ? input : [input];

  return recipients
    .map((recipient) => formatRecipient(recipient, category))
    .join(",");
}

function normalizeHeaders(headers?: Record<string, string>) {
  if (!headers) {
    return undefined;
  }

  return Object.entries(headers).map(([Name, Value]) => ({ Name, Value }));
}

function normalizeMetadata(input: EmailSendInput) {
  const metadata: Record<string, string> = {};

  if (input.notificationId) {
    metadata.notification_id = input.notificationId;
  }

  if (input.category) {
    metadata.category = input.category;
  }

  if (input.unsubscribeGroup) {
    metadata.unsubscribe_group = input.unsubscribeGroup;
  }

  return Object.keys(metadata).length ? metadata : undefined;
}

function getPrimaryTag(input: EmailSendInput) {
  return input.tags?.[0]?.value ?? input.category ?? undefined;
}

export function getPostmarkEmailProvider(): EmailProvider {
  return {
    providerName: "postmark",
    async sendEmail(input) {
      const config = requireEmailSendConfig();
      const response = await getPostmarkClient().sendEmail({
        From: input.from || config.from,
        Headers: normalizeHeaders(input.headers),
        HtmlBody: input.html || undefined,
        Metadata: normalizeMetadata(input),
        MessageStream: config.postmarkMessageStream,
        ReplyTo: input.replyTo || config.replyTo || undefined,
        Subject: input.subject,
        Tag: getPrimaryTag(input),
        TextBody: input.text || input.previewText || input.subject,
        To: normalizeRecipients(input.to, input.category),
      });

      return {
        id: response.MessageID ?? null,
        provider: "postmark",
      };
    },
  };
}
