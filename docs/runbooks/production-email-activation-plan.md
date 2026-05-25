# Production Email Activation Plan

This plan defines the controlled path for enabling production email sending for
the Trading Research Portal. It is an activation plan only. It does not enable
`EMAIL_SEND_ENABLED`, enable the production email feature flag, configure a
scheduler, or send production email.

## Approval Gate

Production email sending must not be enabled until this exact approval phrase is
provided in the current task:

> I approve enabling production email sending.

Without that exact approval, work is limited to readiness review, documentation,
and safe-off verification.

Scheduler activation requires a separate explicit approval after the controlled
send test passes.

## Postmark Sender And Domain Verification

Before activation:

- Confirm the Postmark account/server is owned by the approved business owner.
- Confirm the sender signature or sending domain is verified in Postmark.
- Confirm the verified sender/domain covers the planned `EMAIL_FROM` address.
- Confirm Postmark outbound webhook is configured for production if provider
  events are required.
- Confirm webhook Basic Auth credentials are stored only in production
  server/runtime environment variables.
- Do not paste Postmark tokens, webhook credentials, or DNS secrets into docs,
  logs, screenshots, or chat.

## SPF, DKIM, And DMARC

Before production sending:

- SPF is configured according to Postmark guidance.
- DKIM is configured and verified.
- DMARC has been reviewed for the sending domain.
- Any custom Return-Path decision is documented.
- DNS propagation is confirmed before sending.
- A rollback owner can remove or adjust DNS/provider settings if deliverability
  or sender reputation issues appear.

## EMAIL_FROM Approval

`EMAIL_FROM` must be approved before it is configured for production sending.

Required evidence:

- Address is covered by the verified Postmark sender/domain.
- Display name is approved.
- Address aligns with product/support expectations.
- Address is not a personal inbox unless explicitly approved for launch.
- Address does not imply investment advice, brokerage services, order execution,
  or copy trading.

## EMAIL_REPLY_TO Approval

`EMAIL_REPLY_TO` must route to a monitored support inbox.

Required evidence:

- Support owner is assigned.
- Expected response workflow is documented.
- Bounce/complaint/support escalation path is documented.
- Reply-to address does not expose a private personal inbox unless explicitly
  approved.

## Production Env Var Setup

Configure production env vars only after readiness approval, and keep sending
off initially:

- `EMAIL_PROVIDER=postmark`
- `EMAIL_SEND_ENABLED=false`
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
- `FEATURE_WEEKLY_DIGEST_ENABLED=false`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_CRON_SECRET`
- `EMAIL_TEST_RECIPIENT` if using a controlled test recipient
- `POSTMARK_SERVER_TOKEN`
- `POSTMARK_MESSAGE_STREAM=outbound`
- `POSTMARK_WEBHOOK_USERNAME`
- `POSTMARK_WEBHOOK_PASSWORD`

Rules:

- Store secrets only in Netlify production server/runtime env.
- Do not commit env values.
- Do not expose provider tokens, webhook credentials, or cron secrets to client
  components.
- Provider sends require both `EMAIL_SEND_ENABLED=true` and
  `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=true`.
- Weekly digest generation requires separate scheduler approval and
  `FEATURE_WEEKLY_DIGEST_ENABLED=true`.

## Queue And Digest Scheduler Plan

No queue or digest scheduler may be configured during the initial activation
unless separately approved.

Before scheduler activation:

- Queue cadence is approved.
- Weekly digest cadence is approved.
- Scheduler owner is assigned.
- Scheduler calls include `EMAIL_CRON_SECRET`.
- Scheduler logs are reviewed to avoid recipient lists, message bodies, and
  secrets.
- Emergency disable path is tested:
  - `EMAIL_SEND_ENABLED=false`
  - `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
  - `FEATURE_WEEKLY_DIGEST_ENABLED=false`
  - scheduler paused or removed

## Controlled Test Send

Do not run a controlled production send until the exact approval phrase is
provided.

Controlled test order:

1. Configure production env vars with `EMAIL_SEND_ENABLED=false`.
2. Trigger a production deploy.
3. Verify production routes and API protection:
   - `/api/email/process-queue` rejects missing `EMAIL_CRON_SECRET`.
   - `/api/email/digest/weekly` rejects missing `EMAIL_CRON_SECRET`.
   - `/api/email/webhook` rejects missing or invalid Postmark Basic Auth.
4. Verify no Postmark token, webhook credential, cron secret, Supabase secret,
   or Stripe secret is exposed in production HTML/client JS.
5. Queue one safe test email for an approved test recipient.
6. If possible, restrict all sends to `EMAIL_TEST_RECIPIENT`.
7. Temporarily enable only what is required for the controlled test.
8. Process one small queue batch.
9. Verify:
   - one email is sent to the approved test recipient,
   - no unintended recipient receives email,
   - `email_notifications` status updates to `sent`,
   - provider is `postmark`,
   - Postmark MessageID is stored,
   - delivery provider event is recorded when available,
   - unsubscribe/preference links are present where appropriate,
   - risk/no-advice disclaimer is present,
   - no private premium/pro content, Pine Script/source code, secrets, card
     data, or recipient lists leak.
10. Restore safe-off settings unless final launch approval says to proceed:
    - `EMAIL_SEND_ENABLED=false`
    - `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
    - `FEATURE_WEEKLY_DIGEST_ENABLED=false`

## Unsubscribe Verification

Before and during controlled testing:

- `/account/notifications` works for authenticated users.
- Public unsubscribe by token works without login.
- Group-specific unsubscribe disables the intended group.
- All unsubscribe disables non-essential content/digest groups.
- Transactional software/billing/account status behavior is documented.
- Unsubscribe pages do not expose private user data.
- Future queueing skips unsubscribed groups.

## Bounce And Complaint Monitoring

Before production sending:

- Postmark webhook is configured with production Basic Auth.
- Delivery, bounce, spam complaint, open, and click events are reviewed if
  enabled.
- Provider events are stored in `email_provider_events`.
- Bounce and complaint events update local notification status.
- Bounced and complained recipients are suppressed locally.
- Future sends skip suppressed recipients.
- Duplicate provider events are idempotent.

If bounce or complaint simulation is not safe in production, document the caveat
and rely on deploy-preview/provider QA plus a monitored production launch window.

## Activation Order

1. Confirm exact approval phrase:
   `I approve enabling production email sending.`
2. Confirm sender/domain, DNS, support, unsubscribe, legal, and rollback
   readiness.
3. Configure production env vars with `EMAIL_SEND_ENABLED=false`.
4. Deploy production.
5. Verify route health and API protection.
6. Verify no secret exposure in production HTML/client JS.
7. Queue one safe test email.
8. Temporarily enable sending for one controlled test only if possible.
9. Send to approved test recipient.
10. Verify Postmark send, MessageID storage, and provider event handling.
11. Restore safe-off settings or proceed only if explicit launch approval says
    to continue.
12. Configure queue/digest scheduler only after separate scheduler approval.

## Rollback

If production email behaves incorrectly:

1. Set `EMAIL_SEND_ENABLED=false`.
2. Set `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
3. Set `FEATURE_WEEKLY_DIGEST_ENABLED=false`.
4. Pause or remove queue/digest scheduler if one exists.
5. Trigger a production deploy if Netlify requires one for env changes.
6. Confirm queue/digest endpoints still reject missing `EMAIL_CRON_SECRET`.
7. Confirm queued rows remain queued, skipped, canceled, or failed without
   sending.
8. Rotate `POSTMARK_SERVER_TOKEN` and webhook Basic Auth credentials if exposure
   is suspected.
9. Record an incident in `/admin/ops/incidents`.
10. Record safe evidence in `/admin/ops/readiness`.

Rollback does not delete email audit rows by default. Retain audit rows unless a
separate owner-approved cleanup task says otherwise.

## Out Of Scope

This plan does not add or enable:

- SMS,
- push notifications,
- broker integrations,
- order execution,
- copy trading,
- automatic TradingView invite automation,
- arbitrary custom email blast tooling.

