# Email Production Readiness Runbook

This runbook prepares production email sending for the Trading Research Portal.
It does not approve sending, enable `EMAIL_SEND_ENABLED`, enable
`FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED`, schedule queue/digest routes, send
production email, or add production Postmark tokens.

## Initial Production Audit

Read-only audit date: 2026-05-25, before the approval-gated controlled
production email drill.

Production URL:

- `https://trading-research-portal.netlify.app`

Initial production email posture before approval-gated setup:

- `EMAIL_PROVIDER`: absent.
- `EMAIL_SEND_ENABLED`: present and false.
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED`: absent/disabled.
- `FEATURE_WEEKLY_DIGEST_ENABLED`: absent/disabled.
- `EMAIL_FROM`: absent.
- `EMAIL_REPLY_TO`: absent.
- `EMAIL_CRON_SECRET`: present, value redacted.
- `EMAIL_TEST_RECIPIENT`: absent.
- `POSTMARK_SERVER_TOKEN`: absent.
- `POSTMARK_MESSAGE_STREAM`: absent.
- `POSTMARK_WEBHOOK_USERNAME`: absent.
- `POSTMARK_WEBHOOK_PASSWORD`: absent.

Scheduler/function status:

- Deployed Netlify Next.js server handler has `schedule: null`.
- No production queue or digest function schedule was found in the read-only
  function audit.

Protected API checks:

- `/api/email/process-queue`: missing secret returns 401.
- `/api/email/digest/weekly`: missing secret returns 401.
- `/api/email/webhook`: missing Basic Auth returns 401.
- `/api/email/webhook`: invalid Basic Auth returns 401.
- `/admin/ops/email`: anonymous users redirect to login.

Initial conclusion:

- Production email sending is disabled.
- Production Postmark provider sending is not configured.
- Production queue/digest routes are protected and not scheduled.
- Production email readiness is blocked until sender/domain, DNS, support,
  legal, scheduler, and controlled-send approvals are complete.

## Post-Approval Drill Update

After the exact approval phrase was provided, production Postmark env vars were
configured for a controlled test window. Secret values were not printed or
committed.

Post-drill production email posture:

- `EMAIL_PROVIDER=postmark`.
- `EMAIL_SEND_ENABLED=false` after the controlled send test.
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- `FEATURE_WEEKLY_DIGEST_ENABLED=false`.
- Postmark server token and webhook Basic Auth credentials are configured in
  production server/runtime env, with values redacted.
- `EMAIL_CRON_SECRET` is configured in production server/runtime env, with value
  redacted.
- No queue/digest scheduler is enabled.

Controlled send result:

- One safe test email was sent to the approved test recipient.
- `email_notifications.provider` was set to `postmark`.
- A Postmark MessageID was stored.
- Postmark activity showed delivery.
- No unintended recipients were observed.
- Production email safe-off was restored after the test.

Remaining caveat:

- Production Postmark webhook ingestion should remain Yellow until real
  `email_provider_events` rows are observed for production provider events.
- Scheduler activation still requires separate explicit approval.

## Approval Required

Production email preparation requires Gate D approval from
`docs/phase-12-launch-plan.md`.

Required wording before production email preparation:

> I approve Gate D production email preparation. I approve the Postmark sender,
> DNS posture, from/reply-to addresses, unsubscribe/support workflow, legal
> review, and rollback owner. Do not enable sending yet.

Required wording before production sending activation:

> I approve enabling production email sending now for the defined controlled
> test or launch window.

## Readiness Checklist

Do not mark production email ready until every required row has evidence and an
owner.

- Postmark account and server are owned by the project/business owner.
- Postmark sender signature or sending domain is verified.
- SPF is configured.
- DKIM is configured.
- DMARC is reviewed.
- Custom Return-Path decision is documented.
- DNS propagation is confirmed before real sending.
- `EMAIL_FROM` is approved.
- `EMAIL_REPLY_TO` is approved.
- Support inbox is monitored.
- Unsubscribe flow is reviewed.
- Notification preferences flow is reviewed.
- Privacy/support copy is reviewed.
- Transactional vs content/digest email policy is documented.
- Legal/business approval is complete.
- Production `EMAIL_CRON_SECRET` is configured and stored server-side.
- Queue processing scheduler approval is complete.
- Weekly digest scheduler approval is complete.
- Controlled production send test is approved.
- Suppression behavior for bounced/complained recipients is verified.
- Safe-preview rules for paid content are confirmed.

## Netlify Production Env Plan

Do not add or change these values until Gate D approval is explicit.

Required production env vars for Postmark sending:

- `EMAIL_PROVIDER=postmark`
- `EMAIL_SEND_ENABLED=false` until send approval
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_CRON_SECRET`
- `POSTMARK_SERVER_TOKEN`
- `POSTMARK_MESSAGE_STREAM=outbound`
- `POSTMARK_WEBHOOK_USERNAME`
- `POSTMARK_WEBHOOK_PASSWORD`

Optional controlled QA env:

- `EMAIL_TEST_RECIPIENT`

Feature flags must remain disabled until final activation approval:

- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
- `FEATURE_WEEKLY_DIGEST_ENABLED=false`

Important:

- Provider sends require both `EMAIL_SEND_ENABLED=true` and
  `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=true`.
- Weekly digest queueing requires `FEATURE_WEEKLY_DIGEST_ENABLED=true`.
- Store Postmark tokens and webhook credentials only in Netlify production
  server/runtime env.
- Never commit Postmark tokens, webhook credentials, email cron secrets, sender
  credentials, or recipient lists.
- Do not expose Postmark credentials to client components.

## Postmark Sender And DNS Checklist

Before production sending:

- Sender signature or sending domain is verified in Postmark.
- `EMAIL_FROM` is covered by the verified sender/domain.
- `EMAIL_REPLY_TO` routes to a monitored support inbox.
- SPF record is configured according to Postmark guidance.
- DKIM record is configured and verified.
- DMARC record and policy are reviewed.
- Custom Return-Path is either configured or explicitly deferred.
- No DNS secret, provider token, webhook credential, or private recipient list is
  pasted into docs, logs, screenshots, or chat.

## Scheduler Setup

Do not enable schedulers without explicit approval.

Before scheduling queue or digest routes:

- Production `EMAIL_CRON_SECRET` is present.
- Scheduler owner is assigned.
- Queue processing cadence is documented.
- Weekly digest cadence is documented.
- Scheduler calls use `EMAIL_CRON_SECRET`.
- Scheduler logs do not include recipient lists, message bodies, or secrets.
- Emergency disable path is tested:
  - `EMAIL_SEND_ENABLED=false`
  - `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
  - `FEATURE_WEEKLY_DIGEST_ENABLED=false`
  - scheduler paused/removed

## Unsubscribe And Support Review

Before production sending:

- `/account/notifications` is available to authenticated users.
- Public unsubscribe route works by token without exposing private user data.
- Content/digest unsubscribe behavior is reviewed.
- Transactional software/billing/account status email behavior is documented.
- Suppressed, bounced, and complained recipients are skipped.
- Support owner and response process are assigned.
- Support inbox is monitored during and after launch.

## Admin Readiness Dashboard

`/admin/ops/email` is the admin-only production email readiness dashboard.

Source review confirms:

- The route calls `requireAdmin("/admin/ops/email")`.
- The page reports env presence only.
- Secret values and recipient values are not displayed.
- The page shows readiness rows from `ops_readiness_checks`.
- The page shows production send posture.
- The page states provider sends require both the feature flag and
  `EMAIL_SEND_ENABLED`.
- The page does not send email.
- The page does not enable cron or schedulers.
- The page does not expose recipient lists.

If an admin session is available, use the page to add evidence notes only after
approval. Do not mark readiness rows passing unless the decision is explicitly
approved in the current task.

## Controlled Production Send Test

Do not run this test until explicitly approved.

1. Confirm Postmark sender/domain and DNS readiness.
2. Confirm `EMAIL_FROM`, `EMAIL_REPLY_TO`, and support owner.
3. Confirm legal/business approval for the controlled test.
4. Temporarily restrict sends to an approved test recipient if possible.
5. Queue one safe test email.
6. Process a small queue batch.
7. Confirm:
   - `email_notifications` status updates to `sent`.
   - provider is `postmark`.
   - Postmark MessageID is stored.
   - delivery event is recorded in `email_provider_events`.
   - unsubscribe/preference links are present when appropriate.
   - no premium/pro private content, exact levels, private update bodies,
     outcome summaries, chart metadata, Pine Script/source code, secrets, or
     recipient lists leak.
8. Restore safe-off settings if this is only a readiness exercise:
   - `EMAIL_SEND_ENABLED=false`
   - `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
   - `FEATURE_WEEKLY_DIGEST_ENABLED=false`
9. Record safe evidence in `/admin/ops/readiness`.

## Content Safety

Emails must use safe summaries and protected links.

Never email:

- full premium/pro thesis,
- exact entry/target/invalidation levels,
- private update bodies,
- outcome summaries,
- lessons learned,
- private chart metadata,
- Pine Script/source code,
- secrets,
- card/payment data,
- raw recipient lists.

Free users must not receive premium/pro private content. Premium users must not
receive Pro-only private content. Software emails must not include private Pine
source code.

## Emergency Email-Disable Procedure

If production email behaves incorrectly:

- Set `EMAIL_SEND_ENABLED=false`.
- Set `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Set `FEATURE_WEEKLY_DIGEST_ENABLED=false`.
- Pause or remove any queue/digest scheduler.
- Trigger a fresh deploy if Netlify requires one for env changes.
- Confirm queue/digest endpoints remain protected by `EMAIL_CRON_SECRET`.
- Confirm queued rows remain queued/skipped and no production emails send.
- Rotate Postmark token or webhook Basic Auth if exposure is suspected.
- Open or update an incident in `/admin/ops/incidents`.

## Final Verification Before Enablement

Production email can be considered launch-ready only when:

- Production app health is Green.
- `/admin/ops/email` readiness items are reviewed.
- Blocking readiness checks are passing or intentionally skipped with evidence.
- Postmark sender/domain and DNS are verified.
- Legal/support review is complete.
- Unsubscribe and preferences are reviewed.
- Production cron/scheduler plan is approved.
- Controlled production send test is explicitly approved.
- Rollback owner is available during the launch window.

Until those conditions are met, production email readiness is Yellow/Blocked and
production email sending must remain disabled.
