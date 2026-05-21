import "server-only";

import type { EmailProviderName } from "./types";

export type EmailConfig = {
  cronSecret: string;
  postmarkMessageStream: string;
  from: string;
  postmarkServerToken: string;
  postmarkWebhookPassword: string;
  postmarkWebhookUsername: string;
  provider: EmailProviderName;
  replyTo: string;
  resendApiKey: string;
  resendWebhookSecret: string;
  sendEnabled: boolean;
  testRecipient: string;
};

function getOptionalEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getBooleanEnv(name: string) {
  return ["1", "true", "yes", "on"].includes(getOptionalEnv(name).toLowerCase());
}

function requireEmailEnv(value: string, name: string, purpose: string) {
  if (value) {
    return value;
  }

  throw new Error(`Missing ${name}. Configure it server-side before ${purpose}.`);
}

export function getEmailConfig(): EmailConfig {
  const provider = getOptionalEnv("EMAIL_PROVIDER") || "postmark";

  if (provider !== "postmark" && provider !== "resend") {
    throw new Error(`Unsupported EMAIL_PROVIDER "${provider}".`);
  }

  return {
    cronSecret: getOptionalEnv("EMAIL_CRON_SECRET"),
    from: getOptionalEnv("EMAIL_FROM"),
    postmarkMessageStream: getOptionalEnv("POSTMARK_MESSAGE_STREAM") || "outbound",
    postmarkServerToken: getOptionalEnv("POSTMARK_SERVER_TOKEN"),
    postmarkWebhookPassword: getOptionalEnv("POSTMARK_WEBHOOK_PASSWORD"),
    postmarkWebhookUsername: getOptionalEnv("POSTMARK_WEBHOOK_USERNAME"),
    provider,
    replyTo: getOptionalEnv("EMAIL_REPLY_TO"),
    resendApiKey: getOptionalEnv("RESEND_API_KEY"),
    resendWebhookSecret: getOptionalEnv("RESEND_WEBHOOK_SECRET"),
    sendEnabled: getBooleanEnv("EMAIL_SEND_ENABLED"),
    testRecipient: getOptionalEnv("EMAIL_TEST_RECIPIENT"),
  };
}

export function isEmailSendingEnabled() {
  return getEmailConfig().sendEnabled;
}

export function getEmailProviderName() {
  return getEmailConfig().provider;
}

export function requireEmailSendConfig() {
  const config = getEmailConfig();

  if (!config.sendEnabled) {
    throw new Error("EMAIL_SEND_ENABLED is false. Email sending is disabled.");
  }

  requireEmailEnv(config.from, "EMAIL_FROM", "sending email");

  if (config.provider === "resend") {
    requireEmailEnv(config.resendApiKey, "RESEND_API_KEY", "sending email");
  }

  if (config.provider === "postmark") {
    requireEmailEnv(
      config.postmarkServerToken,
      "POSTMARK_SERVER_TOKEN",
      "sending email"
    );
  }

  return config;
}

export function requireResendWebhookSecret() {
  return requireEmailEnv(
    getEmailConfig().resendWebhookSecret,
    "RESEND_WEBHOOK_SECRET",
    "processing Resend webhooks"
  );
}

export function requirePostmarkWebhookCredentials() {
  const config = getEmailConfig();

  return {
    password: requireEmailEnv(
      config.postmarkWebhookPassword,
      "POSTMARK_WEBHOOK_PASSWORD",
      "processing Postmark webhooks"
    ),
    username: requireEmailEnv(
      config.postmarkWebhookUsername,
      "POSTMARK_WEBHOOK_USERNAME",
      "processing Postmark webhooks"
    ),
  };
}

export function requireEmailCronSecret() {
  return requireEmailEnv(
    getEmailConfig().cronSecret,
    "EMAIL_CRON_SECRET",
    "running email cron or queue processing"
  );
}

export function assertValidEmailCronSecret(value: string | null | undefined) {
  const expectedSecret = requireEmailCronSecret();

  if (!value || value !== expectedSecret) {
    throw new Error("Invalid EMAIL_CRON_SECRET.");
  }
}

export function getEffectiveRecipientEmail(
  recipientEmail: string,
  category?: string | null
) {
  const config = getEmailConfig();
  const isTransactional =
    category === "account" || category === "billing" || category === "software";

  if (config.testRecipient && !isTransactional) {
    return config.testRecipient;
  }

  return recipientEmail;
}
