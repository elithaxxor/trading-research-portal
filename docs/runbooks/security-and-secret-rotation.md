# Security And Secret Rotation Runbook

Use this runbook to rotate provider secrets and verify the app remains safe. Do not print secret values in chat, logs, commits, docs, screenshots, or incident notes.

## General Rotation Steps

- Identify the provider and affected environments.
- Generate a replacement secret in the provider dashboard.
- Add the new value to the correct Netlify context without printing it.
- Trigger a fresh deploy if required by the hosting platform.
- Verify the new secret works through a safe smoke test.
- Revoke the old secret.
- Confirm no secret value is committed or exposed in HTML/client JS.
- Record safe evidence in ops readiness or incident notes.

## Supabase Key Rotation

- Rotate the affected Supabase key in the intended project.
- Update Netlify env vars for the correct context.
- Confirm local `.env.local` is updated if needed and remains uncommitted.
- Verify database connectivity, authenticated routes, admin routes, and RLS behavior.
- Confirm no service-role or secret key appears in the client bundle.

## Stripe Key Rotation

- Rotate the Stripe secret key in the correct mode.
- Update production or deploy-preview env vars only as intended.
- Rotate webhook signing secret if needed.
- Verify invalid signatures still fail with 400.
- Verify a controlled test-mode checkout/webhook flow in deploy-preview if rotating test keys.
- Do not switch production to live keys unless explicitly approved.

## Postmark Token Rotation

- Rotate the Postmark server token in the Postmark dashboard.
- Update Netlify env vars for the intended context.
- Rotate webhook Basic Auth username/password if needed.
- Verify `/api/email/webhook` rejects invalid Basic Auth.
- Verify queue processing only sends when explicitly enabled and approved.
- Keep production sending disabled unless approval is already complete.

## Netlify Env Update

- Use Netlify UI, CLI, or API to update environment variables.
- Confirm the correct site and deploy context.
- Do not put secret values in `netlify.toml`, README, docs, or source files.
- Trigger a fresh deploy after changes.
- Verify deployment commit and route health.

## Redeploy Verification

- Run local checks: `npm run build`, `npm run lint`, `npx tsc --noEmit`.
- Verify public route health.
- Verify protected route redirects.
- Verify protected API routes reject missing/invalid secrets.
- Verify no secret leakage in production HTML or client JS.
- Confirm launch-control flags remain in the intended state.

## Emergency Actions

- Disable checkout with `FEATURE_CHECKOUT_ENABLED=false`.
- Disable Customer Portal with `FEATURE_CUSTOMER_PORTAL_ENABLED=false`.
- Disable email sending with `EMAIL_SEND_ENABLED=false` and `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- Pause queue/digest schedulers.
- Revoke the suspected secret.
- Open an incident and document the safe, non-secret evidence.
