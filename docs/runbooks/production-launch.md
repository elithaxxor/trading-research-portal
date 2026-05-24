# Production Launch Runbook

This runbook prepares the Trading Research Portal for production launch. It does not approve or enable live Stripe subscriptions, production email sending, broker integrations, order execution, copy trading, or automatic TradingView invite automation.

## Production Deploy Checklist

- Confirm `main` contains the intended release commit.
- Confirm Netlify production deploy completed successfully.
- Verify public routes: `/`, `/pricing`, `/ideas`, `/research`, `/login`, `/register`.
- Verify protected routes redirect anonymous users: `/dashboard`, `/account/billing`, `/account/notifications`, `/admin`.
- Verify `/api/health` returns a public-safe OK response.
- Verify `/api/health/deep` is protected by admin session or `OPS_HEALTH_SECRET`.
- Run local checks before merge or release: `npm run build`, `npm run lint`, `npx tsc --noEmit`.

## Environment Variable Checklist

- Confirm production and deploy-preview contexts are separate in Netlify.
- Confirm secret values are not committed to git.
- Confirm public variables use only `NEXT_PUBLIC_` when safe for browsers.
- Confirm server-only values stay server-side:
  - Supabase secret key
  - Stripe secret key and webhook secret
  - Postmark server token and webhook credentials
  - Email cron secret
  - Ops health secret
- Confirm launch-control flags are set intentionally.

## Supabase Checklist

- Confirm production Supabase project is intentional and approved.
- Confirm all migrations are applied to the intended production project only.
- Confirm generated database types match the applied schema.
- Confirm RLS policies protect member data, paid content, software requests, ops events, and email records.
- Confirm admin-only tables are not readable by regular users.
- Confirm backup and restore procedure has been reviewed.

## Stripe Checklist

- Confirm live Stripe keys are not enabled until explicitly approved.
- Confirm live Premium monthly, Premium annual, Pro monthly, and Pro annual prices exist before enabling live checkout.
- Confirm live webhook endpoint is configured and signing secret is in production env.
- Confirm Customer Portal is configured for live mode.
- Confirm refund, cancellation, tax, and legal review are complete.
- Confirm checkout and portal feature flags remain disabled until approval.

## Postmark Checklist

- Confirm production sending remains disabled until approved.
- Confirm Postmark sender/domain verification is complete before sending.
- Confirm SPF, DKIM, and DMARC have been reviewed.
- Confirm `EMAIL_FROM` and `EMAIL_REPLY_TO` are approved.
- Confirm unsubscribe and support workflows are reviewed.
- Confirm queue and digest scheduling are not enabled without approval.

## Legal/Support Checklist

- Confirm terms mention subscriptions and member content access if live subscriptions are enabled later.
- Confirm privacy policy covers payment processor and email notification provider as needed.
- Confirm refund policy is reviewed by the business/legal owner.
- Confirm risk disclaimers do not promise trading results.
- Confirm no copy-trading or order execution claims appear.
- Confirm support ownership for billing, email, software access, and unsubscribe issues.

## Rollback Plan

- Disable checkout with `FEATURE_CHECKOUT_ENABLED=false`.
- Disable Customer Portal with `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Disable production email sends with `EMAIL_SEND_ENABLED=false` and `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Pause scheduler/cron triggers for queue processing and digest generation.
- Redeploy the previous known-good Netlify production deploy if needed.
- Inspect `stripe_webhook_events`, `subscription_events`, `email_notifications`, `email_provider_events`, `ops_events`, and `ops_incidents` for evidence.
- Document the incident and resolution in `/admin/ops/incidents`.

## Launch Decision

Launch readiness is Green only when blocking readiness checks are passing or intentionally skipped, production env posture is approved, legal/support review is complete, and rollback owners are assigned. The ops checklist itself does not enable live billing or production email.
