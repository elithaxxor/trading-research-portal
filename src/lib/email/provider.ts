import "server-only";

import { getEmailProviderName } from "./config";
import { getResendEmailProvider } from "./resend";
import type { EmailProvider, EmailSendInput } from "./types";

export type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider {
  const provider = getEmailProviderName();

  if (provider === "resend") {
    return getResendEmailProvider();
  }

  throw new Error(`Unsupported email provider "${provider}".`);
}

export async function sendEmail(input: EmailSendInput) {
  return getEmailProvider().sendEmail(input);
}
