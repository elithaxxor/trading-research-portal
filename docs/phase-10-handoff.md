# Phase 10 Handoff Report

## Status

Phase 10 is implemented but remains in progress until hosted Postmark provider
QA passes.

The email notification system is present on branch
`feature/phase-10-email-notifications`. Local queue-only QA, preference updates,
unsubscribe handling, suppression behavior, leak checks, build, lint, and
typecheck passed. Deploy-preview route smoke checks passed. Postmark is now the
active deploy-preview provider, the Postmark server and outbound webhook are
configured, and provider-send QA is pending after a fresh deploy-preview
rebuild.

Production sending is intentionally disabled. Production email is not ready to
enable until sender-domain verification, SPF/DKIM/DMARC review, legal/business
review, and explicit sending approval are complete.

## Scope Delivered

Phase 10 adds server-side email notification infrastructure:

- Postmark as the active email provider and Resend retained as an optional
  legacy provider behind the same provider abstraction.
- Notification preferences for authenticated users.
- Token-based unsubscribe handling.
- Content notification queueing for new ideas and idea updates.
- Lifecycle notification queueing for status changes and closed reviews.
- Weekly digest generation and queueing.
- Software access request status emails.
- Billing/access status emails from meaningful Stripe webhook-driven access
  changes.
- Resend provider webhook event handling.
- Admin notification center for queue/audit review, retry/cancel actions, and
  digest controls.

Phase 10 does not add SMS, push notifications, broker integrations, order
execution, copy trading, automatic TradingView invite automation, arbitrary
custom email blasts, or marketing campaign tooling.

## Files Created

- `src/app/account/notifications/actions.ts`
- `src/app/account/notifications/page.tsx`
- `src/app/admin/notifications/actions.ts`
- `src/app/admin/notifications/page.tsx`
- `src/app/admin/notifications/[id]/page.tsx`
- `src/app/admin/notifications/digests/page.tsx`
- `src/app/api/email/digest/weekly/route.ts`
- `src/app/api/email/process-queue/route.ts`
- `src/app/api/email/webhook/route.ts`
- `src/app/unsubscribe/page.tsx`
- `src/lib/email/admin.ts`
- `src/lib/email/billing-notifications.ts`
- `src/lib/email/config.ts`
- `src/lib/email/content-notifications.ts`
- `src/lib/email/digest.ts`
- `src/lib/email/eligibility.ts`
- `src/lib/email/format.ts`
- `src/lib/email/preferences.ts`
- `src/lib/email/provider.ts`
- `src/lib/email/postmark.ts`
- `src/lib/email/queue.ts`
- `src/lib/email/resend.ts`
- `src/lib/email/safety.ts`
- `src/lib/email/software-notifications.ts`
- `src/lib/email/types.ts`
- `src/lib/email/unsubscribe.ts`
- `src/lib/email/templates/base-layout.ts`
- `src/lib/email/templates/billing-access-status.ts`
- `src/lib/email/templates/closed-review.ts`
- `src/lib/email/templates/idea-update.ts`
- `src/lib/email/templates/lifecycle-update.ts`
- `src/lib/email/templates/new-idea.ts`
- `src/lib/email/templates/software-access-status.ts`
- `src/lib/email/templates/test-email.ts`
- `src/lib/email/templates/weekly-digest.ts`
- `supabase/migrations/20260520203200_phase_10_email_notifications.sql`

## Files Modified

- `.env.example`
- `README.md`
- `package.json`
- `package-lock.json`
- `src/app/admin/ideas/actions.ts`
- `src/app/admin/ideas/lifecycle-actions.ts`
- `src/app/admin/ideas/new/new-idea-form.tsx`
- `src/app/admin/ideas/[id]/edit/edit-idea-form.tsx`
- `src/app/admin/ideas/[id]/edit/lifecycle-panel.tsx`
- `src/app/admin/ideas/[id]/updates/actions.ts`
- `src/app/admin/ideas/[id]/updates/idea-updates-manager.tsx`
- `src/app/admin/software/request-actions.ts`
- `src/app/account/page.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/lib/billing/subscriptions.ts`
- `src/types/database.types.ts`

## Migration Added

`20260520203200_phase_10_email_notifications.sql` extends the email foundation
with:

- `notification_channel` enum.
- `notification_category` enum.
- `email_notification_status` enum.
- `email_unsubscribe_group` enum.
- Additional queue, provider, template, unsubscribe, retry, and audit fields on
  `email_notifications`.
- `notification_preferences`.
- `email_unsubscribes`.
- `email_provider_events`.
- `email_digest_runs`.
- RLS policies for user-owned preferences/notifications and admin-only audit
  visibility.
- Indexes for queue processing, dedupe keys, provider message IDs, unsubscribe
  tokens, provider events, and digest runs.
- Comments documenting safe previews, preference enforcement, unsubscribe
  behavior, and paid-content access checks.

Generated database types include the Phase 10 tables, fields, and enums.

## Notification Categories

- `content`
- `lifecycle`
- `digest`
- `software`
- `billing`
- `account`
- `system`

## Queue and Send Behavior

- Admin workflows can optionally queue notifications using "Notify eligible
  members by email" controls.
- Queueing inserts `email_notifications` rows with template output, safe
  previews, metadata, unsubscribe group, and dedupe key.
- Queueing does not send immediately.
- `EMAIL_SEND_ENABLED=false` keeps the system in queue/log-only mode.
- `/api/email/process-queue` processes a limited batch only when protected by
  `EMAIL_CRON_SECRET`.
- Sending uses the provider abstraction and Resend implementation.
- `EMAIL_TEST_RECIPIENT` can redirect deploy-preview non-transactional test
  email to a safe inbox.
- Suppressed, bounced, complained, and unsubscribed recipients are skipped.
- Retry and cancel actions are admin-only and do not allow arbitrary custom
  email blasts.

## Provider Webhook Behavior

`/api/email/webhook` verifies Postmark webhook Basic Auth credentials with
`POSTMARK_WEBHOOK_USERNAME` and `POSTMARK_WEBHOOK_PASSWORD`. Resend signature
verification remains available only for the optional legacy provider path. The
route stores provider events in `email_provider_events` and links events to
`email_notifications` by provider message ID when possible.

Handled events:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.complained`
- `email.bounced`
- `email.failed`
- `email.opened`
- `email.clicked`

Provider events update notification status for sent, delivered, bounced,
complained, and failed messages. Opened and clicked events update metadata only.
Duplicate provider events are idempotent through provider event IDs.

## Security and Leak Controls

- Email provider secrets are server-only.
- Postmark server tokens and webhook Basic Auth credentials are server-only.
- Queue/digest routes require `EMAIL_CRON_SECRET`.
- The frontend cannot send arbitrary email.
- Premium/pro emails use safe previews and protected app links.
- Free users are not eligible for premium/pro private content emails.
- Software emails do not include Pine Script source code or private
  implementation files.
- Weekly digests are personalized by effective access tier.
- Preferences and unsubscribe groups are respected before sending.
- Suppressed, bounced, and complained recipients are skipped.
- Admin notification views mask recipient addresses and do not expose secrets.

## QA Result

Local QA result: Green.

Verified locally:

- Queue-only behavior with `EMAIL_SEND_ENABLED=false`.
- New idea, idea update, software access status, billing/access status, and
  weekly digest queueing.
- Notification preferences update behavior.
- Token-based unsubscribe behavior.
- Suppression behavior for bounced/complained recipients.
- Leak checks for premium/pro/private content markers and software source code.
- Cleanup of temporary QA rows.
- `npm run build`, `npm run lint`, and `npx tsc --noEmit`.

## Deploy-Preview Result

Deploy preview:

- `https://deploy-preview-12--trading-research-portal.netlify.app`

Verified:

- Public routes load.
- `/account/notifications` redirects anonymous users to login.
- `/admin/notifications` redirects anonymous users to login.
- `/api/email/process-queue` rejects missing secret with `401`.
- `/api/email/digest/weekly` rejects missing secret with `401`.
- `/api/email/webhook` rejects invalid or missing signature with `400`.
- Public HTML/client JS secret-pattern checks passed.

Blocked:

- Deploy-preview email provider variables are not configured.
- Provider-send QA did not run in deploy preview.
- `provider_message_id` storage from a hosted send is not yet verified.
- Resend delivery webhook update behavior is not yet verified in deploy preview.
- Authenticated hosted user/admin email UI QA remains incomplete.

Deploy-preview gate: Yellow.

## Production Readiness Result

Production readiness: Yellow.

Production sending is safe-off because Phase 10 email environment variables are
not configured in the Netlify production context. Real sending is not enabled.

Before enabling production sends:

- Configure `EMAIL_SEND_ENABLED=false` first, then only switch to `true` after
  explicit approval.
- Configure `POSTMARK_SERVER_TOKEN`, `POSTMARK_MESSAGE_STREAM`,
  `POSTMARK_WEBHOOK_USERNAME`, `POSTMARK_WEBHOOK_PASSWORD`, `EMAIL_FROM`,
  `EMAIL_REPLY_TO`, and `EMAIL_CRON_SECRET` in production server/runtime env
  only after production sending is approved.
- Verify the Postmark sending domain or sender signature.
- Confirm SPF/DKIM and review DMARC.
- Approve from/reply-to addresses.
- Complete legal/business review of email notification language, unsubscribe
  behavior, privacy copy, and support workflow.
- Rerun production readiness QA before enabling queue processing.

## Remaining Risks

- Hosted Postmark provider-send QA is still pending until the deploy-preview
  rebuild picks up the configured env vars.
- Postmark production sender, SPF/DKIM, and DMARC readiness are not confirmed.
- Production sending is intentionally disabled and should remain disabled until
  explicit approval.
- Privacy/support copy may need final legal/business review before production
  email sending.
- No production cron/scheduler is configured for queue processing or weekly
  digest generation.
- Email analytics beyond provider event logging are not implemented.

## Recommended Next Step

Push the Postmark provider support so Netlify rebuilds deploy preview with
`EMAIL_PROVIDER=postmark`, `POSTMARK_SERVER_TOKEN`, `POSTMARK_MESSAGE_STREAM`,
and webhook Basic Auth credentials that match `POSTMARK_WEBHOOK_USERNAME` and
`POSTMARK_WEBHOOK_PASSWORD`. Keep `EMAIL_SEND_ENABLED=false` until queue-only
hosted QA is complete, then enable deploy-preview test sending with
`EMAIL_TEST_RECIPIENT` and rerun the full hosted email QA.

After deploy-preview email QA is Green, update this handoff and README to mark
Phase 10 complete. Only after that should production email domain and
deliverability review proceed toward live sending.
