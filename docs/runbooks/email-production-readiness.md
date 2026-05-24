# Email Production Readiness Runbook

This runbook prepares production email sending. It does not approve sending, enable cron, or send email.

## Postmark Sender/Domain Checklist

- Postmark account and server are owned by the project/business owner.
- Sender signature or sending domain is verified.
- `EMAIL_FROM` uses an approved sender.
- `EMAIL_REPLY_TO` points to an approved support inbox.
- Postmark server token is configured only server-side.
- Postmark webhook Basic Auth credentials are configured only server-side.

## SPF/DKIM/DMARC

- SPF record is configured according to Postmark guidance.
- DKIM record is configured and verified.
- DMARC policy is reviewed for the sending domain.
- DNS propagation is confirmed before real sending.
- No DNS secret or provider token is pasted into docs or logs.

## Send Controls

- `EMAIL_SEND_ENABLED=false` until explicit production approval.
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false` until approval.
- `FEATURE_WEEKLY_DIGEST_ENABLED=false` until digest scheduling approval.
- `EMAIL_CRON_SECRET` is configured before queue or digest endpoints are scheduled.
- `/api/email/process-queue` and `/api/email/digest/weekly` reject missing secrets.

## Scheduler Setup

- No production scheduler is enabled without approval.
- Queue processing cadence is documented before activation.
- Weekly digest schedule is documented before activation.
- Scheduler calls use `EMAIL_CRON_SECRET`.
- Scheduler logs do not include recipient lists or secrets.

## Unsubscribe And Support Review

- `/account/notifications` is available to authenticated users.
- Public unsubscribe route works by token without exposing private user data.
- Content/digest unsubscribe behavior is reviewed.
- Transactional software/billing/account email behavior is documented.
- Support owner and response process are assigned.

## Controlled Send Test

- Confirm production sending approval before changing env vars.
- Temporarily restrict sends to an approved test recipient if possible.
- Queue one safe test email.
- Process a small queue batch.
- Confirm provider message ID, delivery event, unsubscribe/preference links, and no private content leakage.
- Restore safe-off settings if the test is only a readiness exercise.

## Content Safety

- Emails must use safe summaries and protected links.
- Do not email full premium/pro thesis, exact entry/target/invalidation levels, private update bodies, outcome summaries, lessons learned, chart metadata, or Pine Script/source code.
- Suppressed, bounced, and complained recipients must be skipped.
