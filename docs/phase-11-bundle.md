# Phase 11 Documentation Bundle

Date: May 24, 2026  
Branch: `feature/phase-11-operations-launch-readiness`  
Deploy preview: `https://deploy-preview-13--trading-research-portal.netlify.app`

## Phase 11 Status

Phase 11 is **complete for deploy-preview QA**.

Current decision:

- Phase 11 implementation: present
- Operations dashboards: passed deploy-preview QA
- Health routes: passed deploy-preview QA
- Readiness and incident workflows: passed deploy-preview QA
- Safe product/admin metrics: passed deploy-preview QA
- Feature flags: displayed and safe-off gates verified
- Secret/leak checks: passed
- Production email sending: disabled and not approved
- Live Stripe subscriptions: disabled and not approved
- Safe to merge code after Green gate: yes
- Safe to enable production email sending: no
- Safe to enable live Stripe subscriptions: no

Phase 11 does not add broker integrations, order execution, copy trading, live
market data feeds, performance promises, production email sending, live Stripe
enablement, automatic TradingView invite automation, SMS, push notifications,
or arbitrary marketing blast tooling.

## README Updates

`README.md` now documents Phase 11 as complete for deploy-preview QA.

The phase status list includes:

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
- Phase 10: Complete for deploy-preview QA
- Phase 11: Complete for deploy-preview QA

The README now documents Phase 11:

- Admin operations dashboards.
- Public and protected health checks.
- Readiness checklists.
- Incident tracking.
- Ops event logging.
- Safe product metrics.
- Stripe live-readiness dashboard.
- Email production-readiness dashboard.
- Launch checklist.
- Feature flags.
- Optional no-op PostHog and Sentry integrations.
- Production runbooks.

The README also documents that production email sending and live Stripe
subscriptions remain disabled until explicit legal, business, and operations
approval.

## Handoff Report

Created:

- `docs/phase-11-handoff.md`

The handoff report includes:

- Current Phase 11 status.
- Scope delivered.
- Files created.
- Files modified.
- Migration added.
- Operations routes.
- Health checks.
- Metrics.
- Readiness dashboards.
- Runbooks.
- QA result.
- Deploy-preview result.
- Remaining risks.
- Recommended next step.

## Migration

Added migration:

- `supabase/migrations/20260524111624_phase_11_operations_readiness.sql`

The migration adds:

- `ops_check_status` enum.
- `ops_check_category` enum.
- `analytics_event_source` enum.
- `ops_readiness_checks`.
- `ops_events`.
- `ops_incidents`.
- `admin_audit_notes`.
- Updated-at triggers for mutable ops tables.
- Admin-only RLS policies for readiness checks, incidents, and audit notes.
- Admin/server-safe insert behavior for ops events.
- Indexes for readiness status/category, launch blockers, event lookup,
  incidents, and audit-note relationships.
- Seeded production-readiness checks for email, Stripe, legal/support,
  Supabase, leak checks, software access, backup/restore, and incident
  response.

Generated database types include the Phase 11 tables and enums.

## Operations Routes

Admin-only operations routes:

- `/admin/ops`
- `/admin/ops/readiness`
- `/admin/ops/incidents`
- `/admin/ops/events`
- `/admin/ops/metrics`
- `/admin/ops/stripe`
- `/admin/ops/email`
- `/admin/ops/launch`

Health routes:

- `/api/health`
- `/api/health/deep`

## Health Checks

`/api/health` is public-safe for uptime monitors. It returns:

- Status.
- App name.
- Safe version/build metadata when available.
- Timestamp.

It does not expose environment values, secrets, recipient lists, Stripe IDs,
private content, card data, or Pine Script/source code.

`/api/health/deep` requires either:

- An admin session, or
- `OPS_HEALTH_SECRET` through a supported protected header.

The deep health route checks redacted operational signals:

- Supabase connectivity.
- Core table availability.
- Stripe billing config presence without values.
- Email queue table availability.
- Postmark config presence without values.
- Deploy/build metadata when available.

The deep health route must not send email, create Stripe sessions, mutate data,
or expose secret values.

## Admin Operations Dashboard

`/admin/ops` shows:

- App health status.
- Unresolved incidents.
- Blocking launch checks.
- Content count.
- Member count.
- Active subscription count.
- Queued email count.
- Software access request count.
- Recent deploy/build metadata when available.
- Launch-control feature flags.
- Warnings that production email sending and live Stripe are not enabled unless
  approved.

All admin ops pages require `requireAdmin()`.

## Readiness Dashboard

`/admin/ops/readiness` lists and filters readiness checks by category, status,
and launch-blocking state. Admins can update:

- Status.
- Owner.
- Evidence note.

Seeded readiness checks include:

- Production email sender verification.
- Production email SPF/DKIM/DMARC review.
- Production email legal approval.
- Production email send-enabled approval.
- Live Stripe keys configured.
- Live Stripe webhook configured.
- Live Stripe legal approval.
- Production Supabase project approved or intentionally shared.
- Production admin smoke tested.
- Premium/pro leak checks passed.
- Software access model verified.
- Pricing copy reviewed.
- Refund policy reviewed.
- Privacy policy reviewed.
- Backup/restore plan reviewed.
- Incident response runbook reviewed.

Readiness checks are evidence and workflow records only. They do not enable live
billing or email sending.

## Incident Tracking

`/admin/ops/incidents` lets admins:

- Create incidents.
- Update severity and status.
- Resolve incidents with a safe resolution note.

Incident notes must not include secrets, passwords, private member content,
card data, raw provider payloads, or Pine Script/source code.

Recommended severity model:

- `critical`: production unavailable, data exposure, or payment/access
  corruption.
- `high`: major protected workflow unavailable.
- `medium`: important workflow degraded with workaround.
- `low`: minor admin or copy issue.

## Ops Events

`ops_events` records high-level product and admin events. Event writes are
server-side where possible.

Supported event model includes:

- `page_view_server`
- `idea_viewed`
- `research_viewed`
- `software_product_viewed`
- `software_access_requested`
- `saved_idea_added`
- `ticker_followed`
- `watchlist_item_added`
- `checkout_started`
- `checkout_completed`
- `billing_portal_opened`
- `notification_preference_updated`
- `notification_unsubscribed`
- `admin_content_published`
- `admin_lifecycle_updated`
- `admin_software_request_updated`

Ops event metadata may include safe context such as route, entity type/id,
source, tier, and status. It must not include:

- Full private thesis text.
- Exact entry, target, or invalidation values.
- Private update bodies.
- Outcome summaries or lessons learned.
- Private chart metadata.
- Pine Script/source code.
- Secrets.
- Card/payment data.
- Raw emails.

## Metrics

`/admin/ops/metrics` shows aggregate operational metrics only.

Content metrics:

- Total ideas.
- Published ideas.
- Premium/pro ideas.
- Recently updated ideas.
- Closed reviews.
- Research posts.

Member metrics:

- Total profiles.
- Active free/premium/pro subscription counts.
- Recent signups.
- Dashboard activity counts when available.

Software metrics:

- Published Lite software count.
- Published Pro software count.
- Open software access requests.
- Granted software access requests.
- Revoked/rejected software access requests.

Billing metrics:

- Active premium count.
- Active pro count.
- Past-due count.
- Canceled count.
- Recent checkout sessions.
- Webhook failures.

Email metrics:

- Queued.
- Sent.
- Delivered.
- Failed.
- Bounced.
- Complained.
- Suppressed.
- Digest runs.

Admin ops metrics:

- Open incidents.
- Blocked readiness checks.

Metrics must not become trading P&L reporting, performance reporting, private
member note exposure, raw recipient exposure, or private content body exposure.
Email addresses and Stripe IDs are masked where shown.

## Stripe Live-Readiness Dashboard

`/admin/ops/stripe` shows live billing readiness without enabling live billing.

Displayed readiness includes:

- Live Stripe secret configured: yes/no without value.
- Live Premium monthly price configured.
- Live Premium annual price configured.
- Live Pro monthly price configured.
- Live Pro annual price configured.
- Live webhook secret configured.
- Customer Portal live configured.
- Refund policy reviewed.
- Cancellation policy reviewed.
- Tax/legal review complete.
- Checkout enabled flag.
- Production Supabase project approved.

Safety behavior:

- Does not print Stripe values.
- Does not create Checkout sessions.
- Does not mutate subscriptions.
- Does not enable live billing.
- Allows readiness status/evidence notes only.

Warnings:

- Deploy-preview/test-mode QA is not the same as live billing approval.
- Live billing requires business/legal approval.

## Email Production-Readiness Dashboard

`/admin/ops/email` shows production email readiness without enabling sending.

Displayed readiness includes:

- `EMAIL_SEND_ENABLED` production state.
- Postmark sender/domain verification.
- SPF configured.
- DKIM configured.
- DMARC reviewed.
- `EMAIL_FROM` approved.
- `EMAIL_REPLY_TO` approved.
- `EMAIL_CRON_SECRET` configured.
- Queue/digest scheduler approved.
- Unsubscribe flow reviewed.
- Support process reviewed.
- Legal/business approval complete.

Recent email metrics include:

- Queued count.
- Sent count.
- Delivered count.
- Bounced count.
- Complained count.
- Suppressed count.
- Failed count.
- Digest runs count.

Safety behavior:

- Does not send email.
- Does not enable cron.
- Does not expose recipient lists publicly.
- Masks email addresses where appropriate.
- Allows readiness status/evidence notes only.

## Launch Checklist

`/admin/ops/launch` summarizes launch readiness across:

- App health.
- Auth.
- Content access.
- Stripe live readiness.
- Email sending readiness.
- Legal/support.
- Security/secrets.
- Monitoring.
- Backup/restore.
- Incident response.

It highlights launch-blocking checks. It does not enable live billing or
production email sending.

## Feature Flags

Feature flags are environment-backed launch controls:

- `checkout_enabled`
- `customer_portal_enabled`
- `production_email_sending_enabled`
- `weekly_digest_enabled`
- `admin_content_email_notify_enabled`
- `software_access_requests_enabled`
- `posthog_enabled`
- `sentry_enabled`
- `maintenance_banner_enabled`

Environment variables:

- `FEATURE_CHECKOUT_ENABLED=false`
- `FEATURE_CUSTOMER_PORTAL_ENABLED=false`
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
- `FEATURE_WEEKLY_DIGEST_ENABLED=false`
- `FEATURE_ADMIN_CONTENT_EMAIL_NOTIFY_ENABLED=true`
- `FEATURE_SOFTWARE_ACCESS_REQUESTS_ENABLED=true`
- `FEATURE_MAINTENANCE_BANNER_ENABLED=false`

Rules:

- Feature flags are not access control.
- Client flags cannot grant paid access.
- RLS and server-side tier checks remain authoritative.
- Checkout should not run when `FEATURE_CHECKOUT_ENABLED=false`.
- Customer Portal should not run when `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Provider email sends require both `EMAIL_SEND_ENABLED=true` and
  `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=true`.
- Weekly digest queueing requires `FEATURE_WEEKLY_DIGEST_ENABLED=true`.

## Optional PostHog Integration

PostHog support is optional and no-op by default.

Environment placeholders:

- `NEXT_PUBLIC_POSTHOG_KEY=`
- `NEXT_PUBLIC_POSTHOG_HOST=`
- `POSTHOG_ENABLED=false`

Behavior:

- If `POSTHOG_ENABLED=false` or the public key is missing, analytics are no-op.
- Builds do not require PostHog env vars.
- Client-side analytics must not send private idea details, exact levels,
  protected research bodies, Pine Script/source code, secrets, card data, raw
  emails, or sensitive user data.
- Production analytics requires privacy/legal review.
- Session replay remains disabled unless explicitly approved.

## Optional Sentry Integration

Sentry support is optional and no-op by default.

Environment placeholders:

- `NEXT_PUBLIC_SENTRY_DSN=`
- `SENTRY_AUTH_TOKEN=`
- `SENTRY_ORG=`
- `SENTRY_PROJECT=`
- `SENTRY_ENABLED=false`

Behavior:

- If `SENTRY_ENABLED=false` or the DSN is missing, Sentry capture is no-op.
- Builds do not require Sentry env vars.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are server/build-time
  values only.
- Source-map upload stays disabled unless intentionally configured.
- Sentry scrubs Supabase, Stripe, and Postmark secrets, authorization headers,
  cookies, raw emails, private content bodies, exact trading levels, Pine
  Script/source code, and payment/card data.
- Production monitoring requires privacy/legal review.

## Runbooks Consolidated

Phase 11 created five production runbooks:

- `docs/runbooks/production-launch.md`
- `docs/runbooks/incident-response.md`
- `docs/runbooks/stripe-live-readiness.md`
- `docs/runbooks/email-production-readiness.md`
- `docs/runbooks/security-and-secret-rotation.md`

### Production Launch Runbook

Production deploy checklist:

- Confirm `main` contains the intended release commit.
- Confirm Netlify production deploy completed successfully.
- Verify public routes: `/`, `/pricing`, `/ideas`, `/research`, `/login`,
  `/register`.
- Verify protected routes redirect anonymous users: `/dashboard`,
  `/account/billing`, `/account/notifications`, `/admin`.
- Verify `/api/health` returns a public-safe OK response.
- Verify `/api/health/deep` is protected by admin session or
  `OPS_HEALTH_SECRET`.
- Run local checks before merge or release: `npm run build`, `npm run lint`,
  `npx tsc --noEmit`.

Environment checklist:

- Production and deploy-preview contexts are separate in Netlify.
- Secret values are not committed to git.
- Public variables use `NEXT_PUBLIC_` only when safe for browsers.
- Server-only values stay server-side: Supabase secret key, Stripe secret key
  and webhook secret, Postmark server token and webhook credentials, email cron
  secret, and ops health secret.
- Launch-control flags are set intentionally.

Rollback plan:

- Disable checkout with `FEATURE_CHECKOUT_ENABLED=false`.
- Disable Customer Portal with `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Disable production email sends with `EMAIL_SEND_ENABLED=false` and
  `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Pause scheduler/cron triggers for queue processing and digest generation.
- Redeploy the previous known-good Netlify production deploy if needed.
- Inspect Stripe, subscription, email, ops event, and incident audit tables for
  evidence.
- Document the incident and resolution in `/admin/ops/incidents`.

### Incident Response Runbook

First response:

- Capture affected route, time window, deploy context, and user-visible symptom.
- Determine whether the issue is production, deploy-preview, local only, or
  provider-specific.
- Create or update an incident in `/admin/ops/incidents`.
- Assign severity.

For 500s/502s:

- Check Netlify deploy and function/runtime logs.
- Find the first real server error, not just the final 500/502 line.
- Check recent commits and environment changes.
- Confirm required env vars are present without printing values.
- Reproduce on the smallest route or action possible.
- Ensure server actions catch expected setup failures and log safe structured
  context only.

Disable checkout:

- Set `FEATURE_CHECKOUT_ENABLED=false`.
- Set `FEATURE_CUSTOMER_PORTAL_ENABLED=false` if needed.
- Redeploy if env refresh is required.
- Verify `/pricing` loads and checkout actions fail gracefully.
- Do not manually mutate subscription tiers unless explicitly approved.

Disable email sending:

- Set `EMAIL_SEND_ENABLED=false`.
- Set `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Pause queue/digest schedulers if configured.
- Verify `/api/email/process-queue` remains protected by `EMAIL_CRON_SECRET`.
- Confirm no production email sends.

Resolution:

- Document root cause, impact, fix, verification, and follow-up tasks.
- Mark resolved only after production or deploy-preview retest passes.
- Update readiness evidence if the incident affects launch approval.

### Stripe Live Readiness Runbook

Live Stripe prerequisites:

- Intended live Stripe account is confirmed.
- Live secret key is configured only in production server environment.
- Live Premium monthly, Premium annual, Pro monthly, and Pro annual price IDs
  are configured.
- Live products/prices are active and recurring.
- Test-mode price IDs are not mixed with live-mode keys.
- Checkout feature flag remains disabled until explicit approval.

Webhook checklist:

- Production webhook endpoint is `/api/stripe/webhook`.
- Webhook signing secret is configured in production env.
- Required events are enabled:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `invoice.payment_action_required`
  - `customer.subscription.trial_will_end`
- Invalid or missing signatures return `400`.
- Idempotency is verified through `stripe_webhook_events`.
- Audit rows are verified in `subscription_events`.

Legal/business checklist:

- Terms mention subscriptions and member access.
- Refund policy is approved.
- Cancellation policy is approved.
- Tax settings are reviewed.
- Pricing copy is reviewed.
- Risk disclaimer states no guaranteed results.
- No broker connection, order execution, copy trading, or performance promises
  are made.

### Email Production Readiness Runbook

Postmark sender/domain checklist:

- Postmark account and server are owned by the project/business owner.
- Sender signature or sending domain is verified.
- `EMAIL_FROM` uses an approved sender.
- `EMAIL_REPLY_TO` points to an approved support inbox.
- Postmark server token is configured only server-side.
- Postmark webhook Basic Auth credentials are configured only server-side.

SPF/DKIM/DMARC:

- SPF record is configured according to Postmark guidance.
- DKIM record is configured and verified.
- DMARC policy is reviewed for the sending domain.
- DNS propagation is confirmed before real sending.
- DNS secrets or provider tokens are not pasted into docs or logs.

Send controls:

- `EMAIL_SEND_ENABLED=false` until explicit production approval.
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false` until approval.
- `FEATURE_WEEKLY_DIGEST_ENABLED=false` until digest scheduling approval.
- `EMAIL_CRON_SECRET` is configured before queue/digest endpoints are scheduled.
- `/api/email/process-queue` and `/api/email/digest/weekly` reject missing
  secrets.

Controlled send test:

- Confirm production sending approval before changing env vars.
- Temporarily restrict sends to an approved test recipient if possible.
- Queue one safe test email.
- Process a small queue batch.
- Confirm provider message ID, delivery event, unsubscribe/preference links,
  and no private content leakage.
- Restore safe-off settings if the test is only a readiness exercise.

### Security And Secret Rotation Runbook

General rotation steps:

- Identify the provider and affected environments.
- Generate a replacement secret in the provider dashboard.
- Add the new value to the correct Netlify context without printing it.
- Trigger a fresh deploy if required.
- Verify the new secret works through a safe smoke test.
- Revoke the old secret.
- Confirm no secret value is committed or exposed in HTML/client JS.
- Record safe evidence in ops readiness or incident notes.

Provider-specific rotation:

- Supabase: rotate affected key, update intended Netlify context, verify
  database connectivity, authenticated routes, admin routes, and RLS behavior.
- Stripe: rotate secret key and webhook signing secret in the correct mode,
  verify invalid signatures fail with `400`, and do not switch production to
  live keys unless explicitly approved.
- Postmark: rotate server token and webhook Basic Auth if needed, verify
  webhook rejects invalid Basic Auth, and keep production sending disabled
  unless approval is complete.
- Netlify: update env vars in the correct site/context, never commit secret
  values, trigger a fresh deploy, and verify route health.

Emergency actions:

- Disable checkout with `FEATURE_CHECKOUT_ENABLED=false`.
- Disable Customer Portal with `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Disable email sending with `EMAIL_SEND_ENABLED=false` and
  `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Pause queue/digest schedulers.
- Revoke the suspected secret.
- Open an incident and document safe, non-secret evidence.

## Security Model

Phase 11 security rules:

- Admin operations pages require `requireAdmin()`.
- Regular users cannot access admin ops tables or other users' behavior events.
- Ops metadata must not store secrets, card data, private content bodies, exact
  trading levels, private chart metadata, member notes, raw email addresses, or
  Pine Script/source code.
- Ops metrics are aggregate operational counts only.
- `/api/health` is public-safe.
- `/api/health/deep` is protected.
- Feature flags are kill switches only and cannot grant paid access.
- RLS, server-side tier checks, Stripe webhooks, email preferences,
  unsubscribes, and suppression remain authoritative.
- Live Stripe billing and production email sending remain disabled unless
  explicitly approved.

## QA Result

Local QA result: Green.

Verified:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- Public routes.
- Protected route redirects.
- Admin ops route access.
- `/api/health` public-safe response.
- `/api/health/deep` unauthorized rejection.
- Stripe webhook invalid signature returns `400`.
- Postmark webhook invalid Basic Auth returns `401`.
- Email queue/digest APIs reject missing `EMAIL_CRON_SECRET`.
- No secrets in tracked files.
- No private content or secret fields in ops metadata patterns.
- No broker/order/copy-trading/live email/live Stripe enablement was added.

Deploy-preview result: Green.

Verified on deploy preview:

- Public route checks passed for `/`, `/pricing`, `/ideas`, `/research`,
  `/login`, `/register`, `/api/health`, and `/free`.
- Anonymous protected redirects passed for dashboard, account, account billing,
  account notifications, admin, and admin ops routes.
- Protected API checks passed:
  - `/api/health/deep` returns `401` without authorization.
  - `/api/email/process-queue` returns `401` without `EMAIL_CRON_SECRET`.
  - `/api/email/digest/weekly` returns `401` without `EMAIL_CRON_SECRET`.
  - `/api/email/webhook` returns `401` for missing or invalid Postmark Basic
    Auth.
  - `/api/stripe/webhook` returns `400` for invalid signature.
- Authenticated admin pages loaded:
  - `/admin/ops`
  - `/admin/ops/readiness`
  - `/admin/ops/incidents`
  - `/admin/ops/events`
  - `/admin/ops/stripe`
  - `/admin/ops/email`
  - `/admin/ops/metrics`
  - `/admin/ops/launch`
- Readiness update server-action QA passed and restored the edited readiness
  row.
- Temporary incident create/resolve server-action QA passed and deleted the
  temporary incident.
- Feature flags displayed; checkout and production-email live flags remained
  disabled unless explicitly approved.
- Metrics loaded without exposing secrets or private content.
- Regression checks passed for free chart page, premium/pro locked pages,
  dashboard, account billing, account notifications, admin notifications,
  admin software, Stripe webhook invalid-signature behavior, and Postmark
  webhook invalid Basic Auth behavior.
- Secret checks passed for deploy-preview HTML/client JS, admin ops pages,
  health routes, README/docs, tracked files, and Netlify deploy secret scan.
- Temporary QA user and temporary incident cleanup passed.

## Remaining Risks

- Production email sending remains disabled and not approved. It still requires
  Postmark sender/domain verification, SPF/DKIM/DMARC review, approved
  `EMAIL_FROM` and `EMAIL_REPLY_TO`, legal/business review,
  unsubscribe/support workflow review, production `EMAIL_CRON_SECRET`,
  queue/digest scheduling approval, and a controlled production readiness test.
- Live Stripe subscriptions remain disabled and not approved. They still
  require live keys, live prices, live webhook secret, Customer Portal
  readiness, refund/cancellation/tax/legal review, production Supabase
  approval, and a controlled live-mode readiness gate.
- Optional PostHog and Sentry integrations are no-op by default. Production
  analytics/monitoring requires privacy/legal review and explicit environment
  setup. Session replay remains out of scope unless explicitly approved.
- Ops event logging must remain high-level and safe.
- Feature flags must not replace server-side authorization, RLS, Stripe webhook
  sync, or email preference/suppression enforcement.

## Recommended Next Step

Merge Phase 11 after final documentation review, then run a post-merge
production safe-off smoke test. Keep production email sending and live Stripe
subscriptions disabled until their readiness checklists and legal/business
approvals are complete.
