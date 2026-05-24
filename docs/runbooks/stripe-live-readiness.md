# Stripe Live Readiness Runbook

This runbook prepares live Stripe subscriptions. It does not approve live billing or enable Checkout.

## Live Stripe Checklist

- Live Stripe account is the intended business account.
- Live secret key is configured only in the production server environment.
- Live price IDs are configured for:
  - Premium monthly
  - Premium annual
  - Pro monthly
  - Pro annual
- Live products and prices are active and recurring.
- Test-mode price IDs are not mixed with live-mode keys.
- Checkout feature flag remains disabled until explicit approval.

## Webhook Checklist

- Production webhook endpoint is configured: `/api/stripe/webhook`.
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
- Invalid or missing signatures return 400.
- Idempotency is verified through `stripe_webhook_events`.
- Audit rows are verified in `subscription_events`.

## Customer Portal Checklist

- Live Customer Portal is configured in Stripe Dashboard.
- Return URL points to the production app.
- Cancellation policy is reviewed.
- Subscription update behavior is reviewed.
- Portal feature flag remains disabled until explicit approval.

## Legal And Business Checklist

- Terms mention subscriptions and member access.
- Refund policy is approved.
- Cancellation policy is approved.
- Tax settings are reviewed.
- Pricing copy is reviewed.
- Risk disclaimer states no guaranteed results.
- No broker connection, order execution, copy trading, or performance promises are made.

## Test/Live Separation

- Deploy-preview uses test-mode keys and test price IDs.
- Production uses live keys only after approval.
- Supabase production project is intentional and approved.
- Netlify production env vars are separate from deploy-preview env vars.
- Secret values are never committed.

## Final Verification Before Enablement

- Production app health is Green.
- Stripe live readiness dashboard shows all required manual checks passing.
- Checkout and portal actions are still gated server-side.
- A controlled live-mode transaction test is explicitly approved before any public launch.
