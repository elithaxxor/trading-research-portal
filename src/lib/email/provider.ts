import "server-only";

import { getEmailProviderName } from "./config";
import { getPostmarkEmailProvider } from "./postmark";
import { getResendEmailProvider } from "./resend";
import type { EmailProvider, EmailSendInput } from "./types";

export type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider {
  const provider = getEmailProviderName();

  if (provider === "resend") {
    return getResendEmailProvider();
  }

  if (provider === "postmark") {
    return getPostmarkEmailProvider();
  }

  throw new Error(`Unsupported email provider "${provider}".`);
}

export async function sendEmail(input: EmailSendInput) {
  return getEmailProvider().sendEmail(input);
}
