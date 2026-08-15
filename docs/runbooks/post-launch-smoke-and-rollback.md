# Post-Launch Smoke And Rollback Drill

This runbook defines the post-launch smoke test and a non-destructive rollback
drill for the Trading Research Portal. It does not approve or execute a
production rollback, enable live Stripe, enable production email sending,
configure schedulers, send email, or mutate production data.

## Scope And Guardrails

Run this checklist after production deploys, launch-control changes, or
approval-gated billing/email changes.

Do not perform any of these actions unless the current task explicitly approves
them:

- Roll back or publish a different Netlify deploy.
- Enable or disable production feature flags.
- Enable production email sending.
- Send production email.
- Create live Stripe Checkout sessions.
- Create, edit, or delete production incidents.
- Delete production records.

## Post-Launch Smoke Plan

### Public Routes

Verify these routes return HTTP 200:

- `/`
- `/pricing`
- `/ideas`
- `/research`
- `/login`
- `/register`
- `/api/health`

Expected result:

- No `500` or `502` responses.
- No secrets or environment values are visible in HTML/client JavaScript.
- Public pages continue to show risk/no-advice and no-broker/order/copy-trading
  posture where relevant.

### Auth Login

Verify:

- `/login` loads.
- An approved admin/test user can sign in.
- Session persists across dashboard/admin navigation.
- Anonymous users still redirect to login for protected routes.

Do not print passwords, reset tokens, magic links, or session cookies.

### Dashboard

With an authenticated session, verify:

- `/dashboard` loads.
- Dashboard navigation renders.
- Saved/followed/watchlist sections remain accessible according to user access.
- Locked content remains locked for users without paid access.

### Admin

With an admin session, verify:

- `/admin` loads.
- Admin navigation renders.
- Content ops, software, notifications, and operations links are present.
- Non-admin users cannot access admin pages.

### Ideas And Research

Verify:

- `/ideas` loads.
- `/research` loads.
- At least one free idea/research detail page loads.
- Premium/Pro locked panels do not leak private content to unauthorized users.

### Software Library

With an authenticated session, verify:

- `/dashboard/software` loads.
- Software cards render.
- Lite/Pro access states follow the current subscription/access model.
- No Pine Script/source code appears in list views or unauthorized views.
- No automatic TradingView invite automation is triggered.

### Pricing

Verify:

- `/pricing` loads.
- Current launch-control posture is visible through the expected buttons or
  safe-off notices.
- Checkout and Customer Portal behavior match approved flags.
- No checkout session is created for anonymous users.

### Health

Verify:

- `/api/health` returns public-safe status.
- `/api/health/deep` rejects unauthorized requests.
- Deep health output, when accessed by an approved admin/secret, does not expose
  secret values.

### Webhook Invalid Auth Behavior

Verify:

- `/api/stripe/webhook` with an invalid signature returns `400`.
- `/api/email/process-queue` without `EMAIL_CRON_SECRET` returns `401`.
- `/api/email/digest/weekly` without `EMAIL_CRON_SECRET` returns `401`.
- `/api/email/webhook` with missing or invalid Postmark Basic Auth returns
  `401`.

Do not send provider webhook payloads unless explicitly testing webhooks.

### Ops Dashboards

With an admin session, verify:

- `/admin/ops`
- `/admin/ops/readiness`
- `/admin/ops/stripe`
- `/admin/ops/email`
- `/admin/ops/launch`

Expected result:

- Pages load for admins.
- Anonymous/non-admin access is blocked.
- Readiness blockers are visible.
- Feature flags and env posture are displayed without values.
- Pages do not enable live Stripe, production email, cron, or schedulers.

## Rollback Drill Plan

### Identify Previous Netlify Deploy

Use Netlify deploy history to identify:

- Current production deploy.
- Immediately previous deploy.
- Last known safe-off deploy.

Important: do not assume the immediately previous deploy is safe. If the prior
deploy was part of a controlled send/test window, choose an earlier safe-off
deploy as the rollback target.

### Confirm Rollback Button Or API Path

Rollback can be initiated from:

- Netlify UI deploy detail page:
  `https://app.netlify.com/projects/trading-research-portal/deploys/<deploy-id>`
- Netlify API operations listed by the CLI:
  - `restoreSiteDeploy`
  - `rollbackSiteDeploy`

This drill verifies the path only. Do not click rollback/publish and do not call
rollback API operations without explicit approval.

### Confirm Env Var Kill Switches

Before or during rollback, confirm these kill switches are available:

- `FEATURE_CHECKOUT_ENABLED=false`
- `FEATURE_CUSTOMER_PORTAL_ENABLED=false`
- `EMAIL_SEND_ENABLED=false`
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
- `FEATURE_WEEKLY_DIGEST_ENABLED=false`

Additional safety actions:

- Pause/remove any queue or digest scheduler if one exists.
- Rotate Stripe/Postmark/Supabase secrets if exposure is suspected.
- Confirm `/api/email/process-queue` and `/api/email/digest/weekly` remain
  protected by `EMAIL_CRON_SECRET`.

### Confirm Incident Record Process

If production is unhealthy and mutation is approved:

1. Open `/admin/ops/incidents`.
2. Create an incident with severity and affected area.
3. Record symptoms, first detection time, active deploy ID, rollback target ID,
   and owner.
4. Add timeline notes as actions are taken.
5. Resolve the incident only after smoke tests pass and owner approval is
   recorded.

Do not create a mock incident during a drill unless explicitly approved.

### Communication Plan

For launch incidents:

- Assign a single incident owner.
- Record current status, customer impact, and mitigation status.
- Avoid performance promises or financial advice language.
- If billing is affected, disable checkout first and state that Stripe manages
  payment details.
- If email is affected, set send flags off and state that notification delivery
  is paused.
- Keep the public message short, factual, and timestamped.

## Non-Destructive Drill Result

Drill date: 2026-05-25.

Production URL:

- `https://trading-research-portal.netlify.app`

Current production deploy:

- Deploy ID: `6a1488a3779fbb91c6c75dc5`
- Commit: `12a05f056273b6b02fc2c0263915cdcc61cc7c75`
- State: ready
- Published at: `2026-05-25T17:37:23.944Z`

Immediately previous production deploy:

- Deploy ID: `6a148828ef366f86e5f7d787`
- Commit: `12a05f056273b6b02fc2c0263915cdcc61cc7c75`
- State: ready
- Published at: `2026-05-25T17:35:21.372Z`

Rollback target selected for this drill:

- Deploy ID: `6a1486d439f53b7d9e1f9da5`
- Commit: `12a05f056273b6b02fc2c0263915cdcc61cc7c75`
- State: ready
- Published at: `2026-05-25T17:29:39.939Z`

Reason for selecting `6a1486d439f53b7d9e1f9da5`:

- The immediately previous deploy was part of a controlled production email
  send-window verification.
- The selected rollback target is the last known safe-off deploy before that
  send-window sequence.

Rollback path verified:

- UI path:
  `https://app.netlify.com/projects/trading-research-portal/deploys/6a1486d439f53b7d9e1f9da5`
- CLI/API capability exists:
  - `restoreSiteDeploy`
  - `rollbackSiteDeploy`

Actions intentionally not performed:

- No production rollback.
- No deploy publish/restore API call.
- No feature flag changes.
- No email send.
- No live Stripe Checkout session.
- No production incident record was created because explicit mutation approval
  was not provided.

## Drill Smoke Results

Public/API smoke:

- `/`: passed.
- `/pricing`: passed.
- `/ideas`: passed.
- `/research`: passed.
- `/login`: passed.
- `/register`: passed.
- `/api/health`: passed.
- `/api/health/deep` unauthorized rejection: passed.
- `/api/stripe/webhook` invalid signature: passed.
- `/api/email/process-queue` missing secret: passed.
- `/api/email/webhook` invalid Basic Auth: passed.

Authenticated/admin smoke:

- `/dashboard`: passed.
- `/admin`: passed.
- `/dashboard/software`: passed.
- `/admin/ops`: passed.
- `/admin/ops/readiness`: passed.
- `/admin/ops/stripe`: passed.
- `/admin/ops/email`: passed.
- `/admin/ops/launch`: passed.

Security smoke:

- Production HTML/client JS secret-value scan: passed.
- Tracked-file secret-value scan: passed for actual secrets; placeholder/env
  variable names remain in docs and `.env.example`.

## Drill Decision

Post-launch smoke: passed.

Rollback drill: passed as a non-destructive dry run.

Open caveats:

- Readiness checklist still contains pending launch-blocking rows until owners
  update evidence/status.
- Production Postmark send worked and provider activity showed delivery, but
  provider webhook ingestion should remain watched until `email_provider_events`
  receives production events.
- Live Stripe secret should be rotated before broad public launch because it was
  exposed in chat during activation work.

