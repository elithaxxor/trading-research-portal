# Phase 10 Documentation Bundle

Date: May 21, 2026  
Branch: `feature/phase-10-email-notifications`  
Deploy preview: `https://deploy-preview-12--trading-research-portal.netlify.app`

## Phase 10 Status

Phase 10 is **in progress**, not complete.

The implementation is present and local QA is Green, but hosted deploy-preview
provider-send QA is still Yellow because the configured Postmark environment
variables need a fresh deploy-preview rebuild and hosted send verification.

Current decision:

- Phase 10 implementation: present
- Local queue/preferences/unsubscribe/suppression/leak QA: passed
- Deploy-preview route smoke QA: passed
- Deploy-preview provider-send QA: pending fresh rebuild
- Production sending: intentionally disabled
- Phase 10 complete: no
- Safe to merge as complete: no
- Safe to enable production email sending: no

## README Updates

`README.md` was updated to reflect the actual Phase 10 state:

- Phase 0: Complete
- Phase 1: Complete
- Phase 2: Complete
- Phase 2.5: Complete
- Phase 3: Complete
- Phase 4: Complete
- Phase 5: Complete
- Phase 6: Complete
- Phase 7: Complete
- Phase 8: Complete
- Phase 9: Complete
- Phase 10: In progress

The README now documents that Phase 10 includes:

- Postmark-active email provider abstraction with optional Resend fallback
- Notification preferences
- Token-based unsubscribe flow
- Content notification queueing
- Lifecycle notification queueing
- Weekly digest generation
- Software access request status emails
- Billing/access status emails
- Email provider webhook event handling
- Admin notification center

The README also documents Phase 10 routes:

- `/account/notifications`
- `/unsubscribe?token=...`
- `/admin/notifications`
- `/admin/notifications/[id]`
- `/admin/notifications/digests`
- `/api/email/process-queue`
- `/api/email/digest/weekly`
- `/api/email/webhook`

The README security section was updated to clarify:

- Email provider secrets are server-only.
- Queue and digest routes require `EMAIL_CRON_SECRET`.
- Premium/pro content must not be placed directly into email bodies.
- Free users must not receive premium/pro private content.
- Software emails must not include Pine Script source code or private
  implementation files.
- Preferences and unsubscribe groups are enforced before sending.
- Bounced, complained, and suppressed recipients are skipped.
- SMS, push notifications, broker integration, order execution, copy trading,
  and automatic TradingView invite automation remain out of scope.

The README now points future work toward completing hosted Phase 10 email QA
before any Phase 11 is defined.

## Handoff Report

Created:

- `docs/phase-10-handoff.md`

The handoff report includes:

- Current Phase 10 status
- Scope delivered
- Files created
- Files modified
- Migration added
- Notification categories
- Queue/send behavior
- Provider webhook behavior
- Security and leak controls
- Local QA result
- Deploy-preview result
- Production readiness result
- Remaining risks
- Recommended next step

## Migration

Added migration:

- `supabase/migrations/20260520203200_phase_10_email_notifications.sql`

The migration extends the email foundation with:

- `notification_channel`
- `notification_category`
- `email_notification_status`
- `email_unsubscribe_group`
- Additional `email_notifications` queue/provider/template/retry fields
- `notification_preferences`
- `email_unsubscribes`
- `email_provider_events`
- `email_digest_runs`
- RLS policies
- Queue, dedupe, provider message, unsubscribe token, provider event, and
  digest indexes

Generated database types include the Phase 10 tables, fields, and enums.

## Notification Categories

Phase 10 supports:

- `content`
- `lifecycle`
- `digest`
- `software`
- `billing`
- `account`
- `system`

## Queue and Send Behavior

- Admin content/lifecycle workflows can optionally queue notifications.
- Queueing writes `email_notifications` rows.
- Queueing does not send immediately.
- `EMAIL_SEND_ENABLED=false` keeps the system in queue/log-only mode.
- `/api/email/process-queue` processes a limited batch only with
  `EMAIL_CRON_SECRET`.
- `/api/email/digest/weekly` queues weekly digests only with
  `EMAIL_CRON_SECRET`.
- `EMAIL_TEST_RECIPIENT` can redirect deploy-preview non-transactional test
  email to a safe inbox.
- Suppressed, bounced, complained, and unsubscribed recipients are skipped.

## Provider Webhook Behavior

`/api/email/webhook` verifies Postmark webhook Basic Auth credentials with
`POSTMARK_WEBHOOK_USERNAME` and `POSTMARK_WEBHOOK_PASSWORD`. Resend signature
verification remains available only for the optional legacy provider path.

Handled provider events:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.complained`
- `email.bounced`
- `email.failed`
- `email.opened`
- `email.clicked`

Provider events are stored in `email_provider_events` and linked back to
`email_notifications` by provider message ID when possible. Duplicate provider
events are handled idempotently.

## QA Result

Local QA result: Green.

Verified locally:

- Queue-only behavior with sending disabled
- Content notification queueing
- Lifecycle notification queueing
- Software access status notification queueing
- Billing/access status notification queueing
- Weekly digest queueing
- Notification preferences updates
- Unsubscribe flow
- Suppression behavior
- Premium/pro/private-content leak checks
- Temporary QA data cleanup

Deploy-preview result: Yellow.

Verified on deploy preview:

- Public routes load.
- `/account/notifications` redirects anonymous users.
- `/admin/notifications` redirects anonymous users.
- `/api/email/process-queue` rejects missing secret with `401`.
- `/api/email/digest/weekly` rejects missing secret with `401`.
- `/api/email/webhook` rejects invalid or missing signature with `400`.
- Public HTML/client JS secret-pattern checks passed.

Blocked on deploy preview:

- Phase 10 email environment variables are missing.
- Provider-send QA did not run.
- `provider_message_id` storage from hosted send is not verified.
- Resend delivery webhook status update is not verified in deploy preview.
- Authenticated hosted user/admin email UI QA is incomplete.

Production readiness result: Yellow.

Production sending is safe-off because the production email environment values
are not configured and `EMAIL_SEND_ENABLED` is not enabled. Before production
sending can be enabled, Resend domain verification, SPF/DKIM/DMARC review,
from/reply-to approval, legal/business review, and explicit send approval are
required.

## Build/Lint/Typecheck Result

Latest local checks:

- `npm run build`: passed
- `npm run lint`: passed
- `npx tsc --noEmit`: passed

## Whether Phase 10 Is Complete

Phase 10 is **not complete yet**.

It should be marked complete only after:

- Netlify deploy-preview email env vars are configured.
- Deploy-preview `EMAIL_SEND_ENABLED=false` queue-only QA passes.
- Deploy-preview test sending with `EMAIL_TEST_RECIPIENT` passes.
- Hosted provider `provider_message_id` storage is verified.
- Hosted Resend webhook delivery/bounce/complaint event handling is verified.
- Authenticated deploy-preview user/admin notification UI QA passes.
- README and handoff are updated from In progress to Complete.

## Recommended Next Step

Push the Postmark provider support so Netlify rebuilds deploy preview with
`EMAIL_PROVIDER=postmark`, `POSTMARK_SERVER_TOKEN`, `POSTMARK_MESSAGE_STREAM`,
and Postmark webhook Basic Auth credentials matching `POSTMARK_WEBHOOK_USERNAME`
and `POSTMARK_WEBHOOK_PASSWORD`. Keep production sending disabled, rerun hosted
email QA, and update the README and handoff only after deploy-preview
provider-send QA is Green.
