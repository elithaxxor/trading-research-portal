# Phase 12 Launch Plan

Phase 12 is the controlled production launch-readiness phase for the Trading
Research Portal. It prepares operational, legal, billing, email, DNS, and
rollback paths without enabling live billing, production email sending,
schedulers, production DNS changes, or production data mutations.

## Non-Negotiable Activation Rule

No automation may enable live Stripe, production email sending, cron
scheduling, production DNS changes, custom domain primary switching, production
data mutation, broker/order/copy-trading functionality, live market data feeds,
or performance-return claims without explicit approval in the current task.

Approval from an earlier phase, document, chat, runbook, or dashboard note is
not enough. The current task must explicitly name the activation being approved,
the target environment, and the rollback owner.

## Phase 12 Scope

Phase 12 may prepare and document:

- Custom domain readiness, DNS checklist, HTTPS expectations, and rollback.
- Production Supabase project decision and migration readiness.
- Live Stripe readiness, including live products, prices, webhook, portal,
  tax/refund/cancellation review, and safe feature-flag posture.
- Production Postmark readiness, including sender/domain verification,
  SPF/DKIM/DMARC review, approved from/reply-to addresses, webhook protection,
  and queue/digest controls.
- Legal and support review for terms, privacy, refunds, cancellation, email
  notifications, support ownership, and risk/no-guarantee language.
- Launch-blocking readiness checks and evidence notes in the admin operations
  dashboard.
- Feature flag safety and rollback controls.
- Controlled go-live sequence with staged checks.
- Post-launch smoke tests and incident-response workflow.

Phase 12 must not:

- Enable live Stripe Checkout or Customer Portal.
- Enable production email sending.
- Enable queue, digest, or provider-send schedulers.
- Switch a custom domain to primary production traffic.
- Mutate production data except with explicit approval.
- Add broker integrations, order execution, copy trading, live market data, or
  performance promises.

## Current Safe-Off Defaults

The expected safe-off posture before approvals:

- `FEATURE_CHECKOUT_ENABLED` is false or absent.
- `FEATURE_CUSTOMER_PORTAL_ENABLED` is false or absent.
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED` is false or absent.
- `FEATURE_WEEKLY_DIGEST_ENABLED` is false or absent.
- `EMAIL_SEND_ENABLED` is false or absent.
- Production Stripe live secret, webhook secret, and live price IDs are absent
  or not enabled unless explicitly approved.
- No production function schedules, queue processors, digest jobs, or external
  cron triggers are active.

## Controlled Go-Live Sequence

1. Confirm production deploy health on the current approved commit.
2. Confirm all launch-blocking readiness checks are passing or intentionally
   skipped with evidence.
3. Confirm rollback owners and incident response contacts.
4. Confirm custom domain and DNS readiness if a domain is part of launch.
5. Confirm production Supabase project decision and backup/restore posture.
6. Confirm legal/support approval for billing, refunds, cancellation, email,
   privacy, and disclaimers.
7. Prepare live Stripe values in the correct production context only after Gate
   C approval, while keeping checkout flags off.
8. Prepare production Postmark values in the correct production context only
   after Gate D approval, while keeping send flags off.
9. Run controlled production email and live Stripe tests only after explicit
   approval for each test.
10. Run post-launch smoke tests.
11. Keep monitoring open through the launch window and record evidence in ops
    readiness or incident notes.

## Post-Launch Smoke Tests

After any approved launch activation, verify:

- Public routes: `/`, `/pricing`, `/ideas`, `/research`, `/login`, `/register`,
  and `/api/health`.
- Protected redirects: `/dashboard`, `/account`, `/account/billing`,
  `/account/notifications`, `/admin`, and `/admin/ops`.
- Protected APIs reject missing or invalid secrets.
- Stripe webhook invalid signatures return 400.
- Postmark webhook invalid Basic Auth returns 401.
- No secret values appear in HTML, client JavaScript, docs, logs, or screenshots.
- Pricing, locked Premium/Pro panels, free chart page, dashboard, admin routes,
  and software access still behave correctly.
- Any enabled launch feature can be disabled with its documented kill switch.

## Rollback Controls

Primary rollback levers:

- Set `FEATURE_CHECKOUT_ENABLED=false`.
- Set `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Set `EMAIL_SEND_ENABLED=false`.
- Set `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Set `FEATURE_WEEKLY_DIGEST_ENABLED=false`.
- Pause or remove any approved queue/digest scheduler.
- Revert custom domain primary routing if a domain switch was approved.
- Redeploy the last known-good Netlify production deploy.
- Rotate affected Supabase, Stripe, Postmark, email cron, or health-check
  secrets if exposure is suspected.
- Create or update an incident in `/admin/ops/incidents`.

## Approval Gates

### Gate A: Custom Domain Approval

Owner:
Business owner and technical operator.

Required evidence:

- Domain ownership is confirmed.
- DNS provider access is confirmed.
- Netlify custom domain settings are reviewed.
- HTTPS certificate path is understood.
- Current production URL remains available as rollback.
- Support and legal pages use approved public domain references if changed.

Readiness checks:

- `production_admin_smoke_tested`
- `incident_response_runbook_reviewed`
- `backup_restore_plan_reviewed`

Rollback plan:

- Remove or pause DNS changes.
- Revert primary domain setting in Netlify.
- Continue serving the Netlify production subdomain.
- Confirm `/api/health` and public routes are healthy after rollback.

Explicit approval wording needed:

> I approve Gate A custom domain preparation for production. I approve the
> named domain, DNS owner, target Netlify site, rollback owner, and test window.

Custom domain primary switching requires a second explicit approval:

> I approve switching the custom domain primary production traffic now.

### Gate B: Production Supabase Approval

Owner:
Business owner and database/operator owner.

Required evidence:

- Decision is documented: separate production Supabase project or explicitly
  approved shared/prelaunch project.
- Production migrations and generated types are aligned.
- RLS policies protect member data, paid content, software requests, email
  records, ops events, and admin-only tables.
- Backup and restore expectations are reviewed.
- Admin access and emergency access owners are documented.

Readiness checks:

- `production_supabase_project_separated_or_approved`
- `backup_restore_plan_reviewed`
- `premium_pro_leak_checks_passed`
- `software_access_model_verified`

Rollback plan:

- Stop launch activation.
- Repoint only with explicit approval.
- Restore from backup if an approved production mutation fails.
- Keep live billing and production sending disabled while database posture is
  unresolved.

Explicit approval wording needed:

> I approve Gate B production Supabase posture for launch. The intended
> Supabase project is approved, backup/restore expectations are reviewed, and
> the rollback owner is assigned.

### Gate C: Live Stripe Approval

Owner:
Business owner, billing owner, and technical operator.

Required evidence:

- Live Stripe account is the intended business account.
- Live Premium monthly, Premium annual, Pro monthly, and Pro annual prices
  exist and are recurring.
- Live webhook endpoint is configured for production.
- Required webhook events are selected.
- Live webhook signing secret is stored in production only.
- Customer Portal live settings are reviewed.
- Refund, cancellation, tax, pricing, terms, privacy, and support policies are
  approved.
- Feature flags remain off until final launch approval.

Readiness checks:

- `live_stripe_keys_configured`
- `live_stripe_webhook_configured`
- `live_stripe_legal_approved`
- `refund_policy_reviewed`
- `pricing_copy_reviewed`
- `production_supabase_project_separated_or_approved`

Rollback plan:

- Set `FEATURE_CHECKOUT_ENABLED=false`.
- Set `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Disable or rotate live Stripe credentials if needed.
- Use Stripe Dashboard for approved subscription cancellation/refund actions.
- Verify webhooks remain idempotent and no frontend action grants paid access.

Explicit approval wording needed:

> I approve Gate C live Stripe preparation for production. I approve the live
> Stripe account, products/prices, webhook, Customer Portal review, legal/billing
> policy review, and rollback owner. Do not enable Checkout yet.

Live checkout activation requires a second explicit approval:

> I approve enabling live Stripe Checkout and Customer Portal in production now.

### Gate D: Production Email Approval

Owner:
Business owner, support owner, and technical operator.

Required evidence:

- Postmark sender or domain is verified.
- SPF, DKIM, and DMARC are configured/reviewed.
- `EMAIL_FROM` and `EMAIL_REPLY_TO` are approved.
- Postmark server token and webhook Basic Auth are production-scoped and
  server-only.
- Unsubscribe and notification preference flows are reviewed.
- Support ownership for replies, unsubscribes, bounces, complaints, and software
  access messages is assigned.
- Email content remains safe-preview-only for paid content.
- Feature flags and `EMAIL_SEND_ENABLED` remain off until final approval.

Readiness checks:

- `production_email_sender_verified`
- `production_email_spf_dkim_dmarc_reviewed`
- `production_email_legal_approved`
- `production_email_send_enabled_approved`
- `privacy_policy_reviewed`
- `incident_response_runbook_reviewed`

Rollback plan:

- Set `EMAIL_SEND_ENABLED=false`.
- Set `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Set `FEATURE_WEEKLY_DIGEST_ENABLED=false`.
- Pause queue and digest schedulers.
- Rotate Postmark server token or webhook Basic Auth credentials if needed.
- Confirm queued rows remain queued/skipped and no production sends occur.

Explicit approval wording needed:

> I approve Gate D production email preparation. I approve the Postmark sender,
> DNS posture, from/reply-to addresses, unsubscribe/support workflow, legal
> review, and rollback owner. Do not enable sending yet.

Production sending activation requires a second explicit approval:

> I approve enabling production email sending now for the defined controlled
> test or launch window.

### Gate E: Legal/Support Approval

Owner:
Business owner and legal/support owner.

Required evidence:

- Terms are reviewed for subscription/member access language.
- Privacy policy is reviewed for Stripe, Postmark, analytics, and ops logging.
- Refund and cancellation policy are approved.
- Pricing page copy is approved.
- No financial advice, guaranteed result, P&L, broker, order execution, or copy
  trading claims are present.
- Support ownership is assigned for billing, email, software access, refunds,
  cancellations, and unsubscribe issues.

Readiness checks:

- `pricing_copy_reviewed`
- `refund_policy_reviewed`
- `privacy_policy_reviewed`
- `live_stripe_legal_approved`
- `production_email_legal_approved`

Rollback plan:

- Keep live billing and production email disabled.
- Revert or update public copy.
- Add incident or readiness notes if public users were exposed to incorrect
  policy language.

Explicit approval wording needed:

> I approve Gate E legal and support launch readiness. Terms, privacy, refund,
> cancellation, pricing, risk disclaimers, email language, and support ownership
> are approved for the named launch window.

### Gate F: Final Launch Approval

Owner:
Business owner, technical operator, billing owner, and support owner.

Required evidence:

- Gates A-E are approved or intentionally marked not applicable.
- All launch-blocking readiness checks are passing or intentionally skipped
  with evidence.
- Production deploy is healthy on the approved commit.
- Rollback owner is available.
- Monitoring and incident response paths are active.
- Controlled production email test and controlled live Stripe test are approved
  if they are part of the launch.

Readiness checks:

- All blocking `ops_readiness_checks`.
- `/admin/ops/launch` summary.
- `/api/health` and protected API route checks.
- Final production route smoke tests.

Rollback plan:

- Use all rollback controls listed in this document.
- Record the incident, root cause, rollback action, and follow-up owner.
- Keep public communication factual and avoid performance promises.

Explicit approval wording needed:

> I approve Gate F final production launch for the approved scope and launch
> window. I approve the named feature flags/env changes, responsible operator,
> rollback owner, monitoring window, and post-launch smoke test checklist.

## Required Human Approval Before Activation

The following always require explicit current-task approval:

- Production DNS record changes.
- Custom domain primary switch.
- Production Supabase project mutation or data migration.
- Live Stripe env vars, live Checkout, live Customer Portal, live webhook
  changes, controlled live transactions, refunds, or cancellations.
- Production Postmark sender activation, queue processing, digest scheduling,
  provider sending, or controlled production send tests.
- Any production cron or scheduler.
- Any public launch announcement or copy change that implies live paid access.

## Phase 12 Completion Criteria

Phase 12 can be marked complete when:

- The launch plan and approval gates are documented.
- The readiness dashboard reflects launch-blocking items and evidence.
- Safe-off posture is verified.
- Required owners and rollback paths are documented.
- A final go/no-go checklist exists.
- No unapproved live Stripe, production email, cron, DNS primary switch, or
  production data mutation was performed.
