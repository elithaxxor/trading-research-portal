# Incident Response Runbook

Use this runbook when production or deploy-preview behavior is degraded. Do not paste secrets, passwords, private content, card data, or Pine Script/source code into incident notes.

## First Response

- Capture the affected route, time window, deploy context, and user-visible symptom.
- Check whether the issue is production, deploy-preview, local only, or provider-specific.
- Create or update an incident in `/admin/ops/incidents`.
- Assign severity:
  - `critical`: production unavailable, data exposure, or payment/access corruption.
  - `high`: major protected workflow unavailable.
  - `medium`: important workflow degraded with workaround.
  - `low`: minor admin or copy issue.

## 500s and 502s

- Check Netlify deploy and function/runtime logs.
- Find the first real server error, not just the final 500/502 line.
- Check recent commits and environment changes.
- Confirm required env vars are present without printing values.
- Reproduce on the smallest route or action possible.
- If a server action fails, verify it catches expected setup failures and logs safe structured context only.

## Netlify Logs

- Use Netlify deploy logs for build failures.
- Use Netlify function/runtime logs for request-time failures.
- Check deploy context and commit SHA before diagnosing.
- Avoid printing secret values from environment inspection.
- If env vars changed, trigger a fresh deploy before retesting.

## Disable Checkout

- Set `FEATURE_CHECKOUT_ENABLED=false`.
- Set `FEATURE_CUSTOMER_PORTAL_ENABLED=false` if portal behavior is affected.
- Redeploy if the hosting platform requires env refresh.
- Verify `/pricing` loads and checkout actions fail gracefully or show disabled messaging.
- Do not mutate subscription tiers manually unless explicitly approved by the business owner.

## Disable Email Sending

- Set `EMAIL_SEND_ENABLED=false`.
- Set `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Pause queue/digest schedulers if configured.
- Verify `/api/email/process-queue` remains protected by `EMAIL_CRON_SECRET`.
- Confirm queued rows remain queued/skipped and no production email sends.

## Revoke Or Rotate Secrets

- Identify the exposed or compromised provider.
- Rotate the provider key in its dashboard.
- Update Netlify env vars without printing values.
- Trigger a fresh deploy.
- Verify old credentials no longer work.
- Review logs and audit tables for suspicious use.

## Communication

- Keep status updates factual and time-stamped.
- Avoid promising trading results, compensation, or legal conclusions.
- For billing incidents, direct users to account billing and support while Stripe receipts remain handled by Stripe.
- For software access incidents, explain that TradingView invite-only access may require manual approval outside the portal.

## Resolution

- Document root cause, impact, fix, verification, and follow-up tasks.
- Mark the incident resolved only after production or deploy-preview retest passes.
- Add or update readiness evidence if the incident affects launch approval.
