import "server-only";

import { Resend } from "resend";

import { getEffectiveRecipientEmail, requireEmailSendConfig } from "./config";
import type { EmailProvider, EmailSendInput } from "./types";

let resendClient: Resend | null = null;

function getResendClient() {
  const config = requireEmailSendConfig();

  if (!resendClient) {
    resendClient = new Resend(config.resendApiKey);
  }

  return resendClient;
}

function normalizeRecipients(
  input: EmailSendInput["to"],
  category: EmailSendInput["category"]
) {
  const recipients = Array.isArray(input) ? input : [input];

  return recipients.map((recipient) => {
    if (typeof recipient === "string") {
      return getEffectiveRecipientEmail(recipient, category);
    }

    const email = getEffectiveRecipientEmail(recipient.email, category);

    return recipient.name ? `${recipient.name} <${email}>` : email;
  });
}

export function getResendEmailProvider(): EmailProvider {
  return {
    providerName: "resend",
    async sendEmail(input) {
      const config = requireEmailSendConfig();
      const basePayload = {
        from: input.from || config.from,
        headers: input.headers,
        replyTo: input.replyTo || config.replyTo || undefined,
        subject: input.subject,
        tags: input.tags,
        to: normalizeRecipients(input.to, input.category),
      };
      const response = await getResendClient().emails.send(
        input.html
          ? {
              ...basePayload,
              html: input.html,
            }
          : {
              ...basePayload,
              text: input.text || input.previewText || input.subject,
            }
      );

      if (response.error) {
        throw new Error(response.error.message || "Resend email send failed.");
      }

      return {
        id: response.data?.id ?? null,
        provider: "resend",
      };
    },
  };
}
