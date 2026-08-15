# Live Stripe Activation Plan

Controlled Phase 12 runbook for enabling live Stripe subscriptions in production. This document is a plan only. It does not enable live billing, add live keys, create live Checkout sessions, mutate subscriptions, or charge cards.

## Required Approval

Live Stripe activation must not begin until the owner gives this exact approval phrase in the current task:

> I approve enabling live Stripe subscriptions in production.

Without that exact approval, keep:

- `FEATURE_CHECKOUT_ENABLED=false`
- `FEATURE_CUSTOMER_PORTAL_ENABLED=false`
- live Stripe env vars absent or inactive
- production subscription mutation limited to verified webhook processing already approved for the activation window

## Prerequisites

- Phase 9 deploy-preview/test-mode Stripe QA is complete and documented.
- Phase 11 production safe-off QA is Green.
- Production app health checks are passing.
- `/admin/ops/stripe` shows readiness without exposing values.
- Refund policy, cancellation policy, pricing copy, tax posture, support workflow, and legal/business review are approved.
- Production Supabase project decision is approved.
- Rollback owner is available during the activation window.
- Netlify deploy and Stripe Dashboard access are available.
- No broker integration, order execution, copy trading, live market data feed, or performance promise is introduced.

## Live Products And Prices

Create or confirm live-mode Stripe products and recurring prices:

| Product | Price | Interval | Production env var |
| --- | --- | --- | --- |
| Premium | Premium Monthly | Monthly | `STRIPE_PREMIUM_MONTHLY_PRICE_ID` |
| Premium | Premium Annual | Yearly | `STRIPE_PREMIUM_ANNUAL_PRICE_ID` |
| Pro | Pro Monthly | Monthly | `STRIPE_PRO_MONTHLY_PRICE_ID` |
| Pro | Pro Annual | Yearly | `STRIPE_PRO_ANNUAL_PRICE_ID` |

Requirements:

- Prices are live-mode, active, recurring, and in the same Stripe account as the live secret key.
- Price amounts match approved pricing copy.
- Product names and billing intervals are reviewed.
- Tax settings are reviewed before launch.
- No test-mode price IDs are used in production live activation.

## Live Webhook Endpoint

Create a live-mode Stripe webhook endpoint:

```text
https://trading-research-portal.netlify.app/api/stripe/webhook
```

Required events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.payment_action_required`
- `customer.subscription.trial_will_end`

Do not reuse the deploy-preview/test-mode webhook signing secret for live mode.

## Live Webhook Secret

Store the live endpoint signing secret in Netlify production as:

```text
STRIPE_WEBHOOK_SECRET
```

Rules:

- Do not print the value.
- Do not commit the value.
- Confirm it belongs to the production webhook endpoint.
- Rotate immediately if exposed.

## Customer Portal Live Config

Before enabling `FEATURE_CUSTOMER_PORTAL_ENABLED`, confirm Stripe Customer Portal live-mode settings:

- Business profile and support contact are correct.
- Cancellation flow is approved.
- Plan changes are configured only if approved.
- Return URL points to production:

```text
https://trading-research-portal.netlify.app/account/billing
```

- Portal behavior is tested with an approved internal live subscription only.

## Netlify Production Env Changes

After explicit approval, configure production Netlify env vars without printing values:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
- `STRIPE_PREMIUM_ANNUAL_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_ANNUAL_PRICE_ID`
- `NEXT_PUBLIC_SITE_URL=https://trading-research-portal.netlify.app` or approved custom domain
- existing Supabase production env vars remain correct

Do not add live keys to deploy-preview unless a separate approved live-mode staging plan exists.

## Feature Flags

Activation flags stay disabled until after env deployment and smoke checks:

```text
FEATURE_CHECKOUT_ENABLED=false
FEATURE_CUSTOMER_PORTAL_ENABLED=false
```

Only after the production deploy has completed and `/pricing` loads without errors may the owner approve enabling:

```text
FEATURE_CHECKOUT_ENABLED=true
```

Only after a controlled checkout and webhook sync pass may the owner approve enabling:

```text
FEATURE_CUSTOMER_PORTAL_ENABLED=true
```

Feature flags are operational kill switches only. They do not grant paid access; RLS, server-side subscription checks, and verified Stripe webhooks remain authoritative.

## Activation Order

1. Receive exact approval phrase in the current task.
2. Configure live Stripe products, prices, webhook endpoint, and Customer Portal.
3. Add live Stripe production env vars in Netlify without printing values.
4. Keep `FEATURE_CHECKOUT_ENABLED=false`.
5. Keep `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
6. Trigger a production deploy.
7. Verify production route health:
   - `/`
   - `/pricing`
   - `/account/billing` anonymous redirect
   - `/api/stripe/webhook` invalid signature returns `400`
8. Confirm no Stripe secrets appear in HTML or client JavaScript.
9. Enable `FEATURE_CHECKOUT_ENABLED=true` only after route health passes.
10. Trigger or confirm production redeploy if Netlify requires it for env changes.
11. Run one controlled internal live checkout with an approved card/account.
12. Verify the customer returns to the app.
13. Verify webhook sync updates Supabase subscription state.
14. Verify paid access unlocks according to plan.
15. Verify no frontend tier/status grant occurred before webhook sync.
16. Enable `FEATURE_CUSTOMER_PORTAL_ENABLED=true` only after checkout and webhook sync pass.
17. Open Customer Portal from `/account/billing`.
18. Verify return URL works.
19. If safe, test cancellation/portal behavior with the controlled internal account.
20. Monitor Stripe, Netlify logs, Supabase audit rows, and `/admin/ops/stripe`.

## Controlled Internal Checkout Test

Test one approved internal account first:

- Use a known internal email/account.
- Start with Premium monthly unless another plan is explicitly approved.
- Use an approved live card/account.
- Confirm the live charge amount before completing payment.
- Confirm `stripe_customers`, `stripe_checkout_sessions`, `stripe_webhook_events`, `subscription_events`, and `subscriptions` update as expected.
- Confirm `/account/billing` shows the live active subscription.
- Confirm Premium unlocks Premium content and Lite software only.
- Confirm Pro content and Pro software remain locked for Premium.
- Cancel or refund according to the approved internal test procedure.

Do not run broad public checkout until the controlled internal test is Green.

## Subscription And Access Verification

Verify:

- `checkout.session.completed` recorded.
- `customer.subscription.created` or `customer.subscription.updated` recorded.
- `invoice.paid` recorded.
- `stripe_webhook_events.processing_status=processed`.
- `subscription_events` row created.
- Subscription row has correct tier, status, price ID, customer ID, subscription ID, and period dates.
- Active Premium unlocks Premium content plus Lite software.
- Active Pro unlocks Premium/Pro content plus Lite/Pro software.
- Canceled, `past_due`, or `unpaid` removes paid access.
- Frontend cannot manually grant paid access.
- Webhooks remain the source of truth.

## Rollback

If anything fails:

1. Set:

```text
FEATURE_CHECKOUT_ENABLED=false
FEATURE_CUSTOMER_PORTAL_ENABLED=false
```

2. Redeploy or confirm Netlify runtime picks up the disabled flags.
3. Confirm `/pricing` no longer starts Checkout.
4. Confirm `/account/billing` no longer opens Customer Portal.
5. Remove live Stripe env vars if account mismatch is suspected or if the
   owner chooses to stop live billing.
6. Disable the production Stripe webhook endpoint if it is misconfigured or unsafe.
7. Create an incident record in `/admin/ops/incidents`.
8. Capture evidence in `/admin/ops/readiness` or the incident record.
9. Communicate status and next steps through the approved support channel.
10. Re-run production safe-off smoke tests.

## Post-Activation Monitoring

Monitor for at least the first launch window:

- Netlify function/runtime errors.
- Stripe webhook delivery and retries.
- `stripe_webhook_events` failed or duplicate processing states.
- `subscription_events` correctness.
- `/admin/ops/stripe` readiness state.
- `/admin/ops/metrics` billing counts.
- Support inbox for checkout, cancellation, refund, or access complaints.
- Secret exposure scans.
- Any unexpected paid-access unlocks or locked-out paid users.

## Go/No-Go Criteria

Go only if:

- Exact approval phrase was provided.
- Legal/business/support approvals are complete.
- Live Stripe products/prices/webhook/portal are configured.
- Production env vars are configured safely.
- Production deploy is healthy.
- Controlled internal checkout passes.
- Webhook subscription sync passes.
- Access automation passes.
- Rollback path is verified.

No-go if:

- Approval phrase is missing.
- Any live key, price, webhook, or portal setting is uncertain.
- `/pricing` or `/api/stripe/webhook` returns 500/502.
- Webhook sync fails.
- Paid access can be granted from frontend state.
- Legal, refund, cancellation, support, or tax review is incomplete.
