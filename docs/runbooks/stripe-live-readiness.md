# Stripe Live Readiness Runbook

This runbook prepares live Stripe subscriptions for the Trading Research
Portal. It does not approve live billing, add live keys, create live Checkout
Sessions, create live products/prices, mutate subscriptions, or enable Checkout.

## Initial Production Audit

Read-only audit date: 2026-05-25, before the approval-gated live Stripe
activation drill.

Production URL:

- `https://trading-research-portal.netlify.app`

Initial production billing posture before approval-gated setup:

- `FEATURE_CHECKOUT_ENABLED`: absent/disabled.
- `FEATURE_CUSTOMER_PORTAL_ENABLED`: absent/disabled.
- `STRIPE_SECRET_KEY`: absent in production.
- `STRIPE_WEBHOOK_SECRET`: absent in production.
- `STRIPE_PREMIUM_MONTHLY_PRICE_ID`: absent in production.
- `STRIPE_PREMIUM_ANNUAL_PRICE_ID`: absent in production.
- `STRIPE_PRO_MONTHLY_PRICE_ID`: absent in production.
- `STRIPE_PRO_ANNUAL_PRICE_ID`: absent in production.
- Live-specific Stripe env vars checked during audit:
  - `STRIPE_LIVE_SECRET_KEY`: absent.
  - `STRIPE_LIVE_WEBHOOK_SECRET`: absent.
- Test-specific Stripe env vars checked during audit:
  - `STRIPE_TEST_SECRET_KEY`: absent.
  - `STRIPE_TEST_WEBHOOK_SECRET`: absent.

Production route checks:

- `/pricing`: returns 200.
- `/account/billing`: redirects anonymous users to login.
- `/api/stripe/webhook`: invalid unsigned request returns 400.
- `/admin/ops/stripe`: redirects anonymous users to login.

Initial conclusion:

- Live Stripe is not enabled.
- Production Checkout is not enabled.
- Production Customer Portal is not enabled.
- No live or test Stripe server secrets are present in production env from this
  audit.

## Post-Approval Drill Update

After the exact approval phrase was provided, live Stripe production env vars
and feature flags were configured for a controlled activation and checkout test.
Secret values were not printed or committed.

Post-drill production billing posture:

- `FEATURE_CHECKOUT_ENABLED=true`.
- `FEATURE_CUSTOMER_PORTAL_ENABLED=true`.
- Live Stripe secret, webhook secret, and live price IDs are configured in
  production server/runtime env, with values redacted.
- Live Checkout and Customer Portal remain kill-switch controlled by feature
  flags.

Controlled live checkout result:

- A temporary `$1` live internal test price was used for one controlled payment.
- Live Checkout completed.
- Webhook sync updated the app subscription and account access.
- The temporary test subscription was canceled after verification.
- The temporary `$1` price was made inactive.
- The normal Premium monthly live price was restored.

Remaining caveat:

- The live Stripe secret key must be rotated before broad public launch because
  it was pasted during setup.
- Launch readiness remains Yellow until owner readiness evidence is updated and
  remaining legal/domain/Supabase decisions are closed.

## Approval Required

Live Stripe preparation requires Gate C approval from
`docs/phase-12-launch-plan.md`.

Required wording before live Stripe preparation:

> I approve Gate C live Stripe preparation for production. I approve the live
> Stripe account, products/prices, webhook, Customer Portal review,
> legal/billing policy review, and rollback owner. Do not enable Checkout yet.

Required wording before live Checkout activation:

> I approve enabling live Stripe Checkout and Customer Portal in production now.

## Live Readiness Checklist

Do not mark live billing ready until every required row has evidence and an
owner.

- Live Stripe account confirmed as the intended business account.
- Live secret key ready for production server/runtime scope only.
- Live Premium monthly recurring price created.
- Live Premium annual recurring price created.
- Live Pro monthly recurring price created.
- Live Pro annual recurring price created.
- Live price IDs belong to the same live Stripe account as the live secret key.
- Live price IDs are not copied from test mode.
- Live webhook endpoint created:
  - `https://<approved-production-domain>/api/stripe/webhook`
- Live webhook signing secret ready for production server/runtime scope only.
- Required webhook events enabled:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `invoice.payment_action_required`
  - `customer.subscription.trial_will_end`
- Customer Portal configured in live mode.
- Customer Portal return URL points to the approved production domain.
- Refund policy approved.
- Cancellation policy approved.
- Tax settings reviewed.
- Pricing copy reviewed.
- Terms and privacy policy reviewed.
- Legal/business approval complete.
- Production Supabase project posture approved.
- Emergency checkout-disable procedure confirmed.
- Controlled live transaction test approved before public activation.

## Netlify Production Env Plan

Do not add or change these values until Gate C approval is explicit.

Required production env vars for live billing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
- `STRIPE_PREMIUM_ANNUAL_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_ANNUAL_PRICE_ID`

Feature flags must remain disabled until final activation approval:

- `FEATURE_CHECKOUT_ENABLED=false`
- `FEATURE_CUSTOMER_PORTAL_ENABLED=false`

Important:

- Store live Stripe secrets only in Netlify production server/runtime env.
- Never commit live keys, webhook secrets, or price IDs.
- Never expose Stripe secret keys to client components.
- Do not use deploy-preview test-mode price IDs in production live billing.

## Webhook Checklist

Before enabling live Checkout:

- Production webhook endpoint is created in the live Stripe Dashboard.
- Webhook endpoint domain matches the approved production domain.
- Webhook signing secret is stored as `STRIPE_WEBHOOK_SECRET` in production.
- Invalid or missing signatures still return 400.
- Duplicate events are idempotent through `stripe_webhook_events`.
- Subscription audit rows are created in `subscription_events`.
- Webhook remains the source of truth for subscription tier/status.
- Checkout action never grants paid access directly.

## Customer Portal Checklist

Before enabling Customer Portal:

- Live Customer Portal is configured in Stripe Dashboard.
- Return URL points to `/account/billing` on the approved production domain.
- Cancellation behavior is reviewed.
- Subscription update behavior is reviewed.
- Refund and support process is documented.
- `FEATURE_CUSTOMER_PORTAL_ENABLED` remains false until explicit activation
  approval.

## Admin Readiness Dashboard

`/admin/ops/stripe` is the admin-only live billing readiness dashboard.

Source review confirms:

- The route calls `requireAdmin("/admin/ops/stripe")`.
- The page reports env presence only.
- Stripe secret and price values are not displayed.
- Feature flag states are shown as readiness signals.
- Readiness rows are pulled from `ops_readiness_checks`.
- The page does not create Checkout Sessions.
- The page does not enable live billing.
- The page does not mutate subscriptions.

If an admin session is available, use the page to add evidence notes only after
approval. Do not mark readiness rows passing unless the decision is explicitly
approved in the current task.

## Legal And Business Checklist

Required before live billing:

- Terms mention subscriptions and member content access.
- Privacy policy mentions Stripe/payment processing as appropriate.
- Refund policy is approved.
- Cancellation policy is approved.
- Tax settings are reviewed.
- Pricing copy is approved.
- Risk disclaimer states no guaranteed results.
- No broker connection, order execution, copy trading, live market data, or
  performance promises are made.
- Support owner is assigned for billing issues, refund questions, and
  cancellation support.

## Test/Live Separation

- Deploy-preview uses test-mode keys and test price IDs.
- Production uses live keys only after Gate C and final launch approval.
- Test-mode Stripe customers, checkout sessions, webhook events, and audit rows
  must not be migrated into live billing history.
- Supabase production project posture must be approved before live billing.
- Netlify production env vars must be separate from deploy-preview env vars.
- Secret values are never committed or pasted into docs.

## Controlled Live Test Plan

Do not run this test until explicitly approved.

1. Confirm live Stripe account and env values are ready without printing values.
2. Keep public launch disabled.
3. Temporarily enable Checkout only for the approved test window if the current
   approval says to do so.
4. Use a controlled live transaction with an approved card and amount.
5. Confirm:
   - Checkout opens on live Stripe.
   - `stripe_customers` row is created.
   - `stripe_checkout_sessions` row is created.
   - `checkout.session.completed` webhook is recorded.
   - subscription row updates only from webhook sync.
   - account billing shows the correct tier/status.
   - access automation unlocks only the intended tier.
6. Cancel/refund according to the approved test plan.
7. Disable live Checkout and Customer Portal if the test is not the public
   launch.
8. Record safe evidence in `/admin/ops/readiness`.

## Emergency Checkout-Disable Procedure

If live billing behaves incorrectly:

- Set `FEATURE_CHECKOUT_ENABLED=false`.
- Set `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Trigger a fresh deploy if Netlify requires one for env changes.
- Confirm `/pricing` loads and no Checkout session can be created.
- Confirm `/account/billing` remains protected.
- Confirm Stripe webhook invalid signatures still return 400.
- Review `stripe_webhook_events`, `subscription_events`,
  `stripe_checkout_sessions`, and `stripe_customers`.
- Open or update an incident in `/admin/ops/incidents`.
- Do not manually grant paid tiers unless explicitly approved by the business
  owner and documented.

## Final Verification Before Enablement

Live Stripe can be considered launch-ready only when:

- Production app health is Green.
- `/admin/ops/stripe` readiness items are reviewed.
- Blocking readiness checks are passing or intentionally skipped with evidence.
- Legal/support review is complete.
- Production Supabase posture is approved.
- Live Stripe webhook is verified.
- Checkout and Customer Portal actions are still server-gated.
- A controlled live-mode transaction test is explicitly approved.
- Rollback owner is available during the launch window.

Until those conditions are met, live Stripe readiness is Yellow/Blocked and
live billing must remain disabled.
