# Phase 12 Documentation Bundle

Date: May 25, 2026  
Branch: `feature/phase-12-production-launch-controls`  
Production URL: `https://trading-research-portal.netlify.app`

## Phase 12 Status

Phase 12 is **complete for launch-control documentation, approval-gated
activation drills, and production go/no-go reporting**.

The final launch posture is **Yellow**, not Green. The production application is
healthy, the controlled live Stripe and production Postmark tests ran after
explicit approval, and rollback paths are documented. The launch gate remains
Yellow because several launch-blocking readiness rows still need owner evidence
or final status updates, the live Stripe secret must be rotated before broad
public launch because it was pasted during setup, and production Postmark
webhook ingestion should be confirmed with observed `email_provider_events`
rows before scheduler activation.

Phase 12 did not add broker integrations, order execution, copy trading, live
market data feeds, performance promises, automatic TradingView invite
automation, SMS, push notifications, arbitrary email blast tooling, or
unapproved schedulers.

## Source Documents Consolidated

This bundle consolidates the important Phase 12 information from:

- `README.md`
- `docs/phase-12-handoff.md`
- `docs/phase-12-launch-plan.md`
- `docs/runbooks/custom-domain-readiness.md`
- `docs/runbooks/supabase-production-project-decision.md`
- `docs/runbooks/stripe-live-readiness.md`
- `docs/runbooks/live-stripe-activation-plan.md`
- `docs/runbooks/email-production-readiness.md`
- `docs/runbooks/production-email-activation-plan.md`
- `docs/runbooks/legal-support-launch-review.md`
- `docs/runbooks/production-data-cleanup-plan.md`
- `docs/runbooks/post-launch-smoke-and-rollback.md`
- Existing Phase 11 runbooks for production launch, incident response, and
  secret rotation.

The source documents remain intact. This file is a review packet, not a
replacement for the detailed runbooks.

## README Updates

`README.md` now documents Phase 12 as the production launch-control phase.

The README status list includes:

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
- Phase 10: Complete
- Phase 11: Complete
- Phase 12: Complete for launch controls and approval-gated production drills

The README now references:

- Launch controls.
- Custom domain readiness.
- Supabase production project decision.
- Stripe live-readiness.
- Email production-readiness.
- Legal/support review.
- Feature flag safe-off posture.
- Production launch runbooks.

## Scope Delivered

Phase 12 delivered:

- Launch-scope and approval-gate documentation.
- Custom domain readiness planning without DNS changes.
- Supabase production-project decision support without data migration.
- Live Stripe readiness review and activation planning.
- Approval-gated live Stripe production activation.
- Controlled live Stripe Checkout test and webhook/access verification.
- Production Postmark/email readiness review and activation planning.
- Approval-gated controlled production Postmark send test.
- Legal/support/pricing/risk copy review.
- Production/prelaunch QA data cleanup plan.
- Launch-control feature flag and safe-off audit.
- Post-launch smoke and rollback drill.
- Phase 12 README, handoff, and consolidated bundle documentation.

## Files Created

- `docs/phase-12-bundle.md`
- `docs/phase-12-handoff.md`
- `docs/phase-12-launch-plan.md`
- `docs/runbooks/custom-domain-readiness.md`
- `docs/runbooks/legal-support-launch-review.md`
- `docs/runbooks/live-stripe-activation-plan.md`
- `docs/runbooks/post-launch-smoke-and-rollback.md`
- `docs/runbooks/production-data-cleanup-plan.md`
- `docs/runbooks/production-email-activation-plan.md`
- `docs/runbooks/supabase-production-project-decision.md`

## Files Modified

Phase 12 documentation and readiness updates:

- `README.md`
- `docs/runbooks/email-production-readiness.md`
- `docs/runbooks/stripe-live-readiness.md`

Launch-copy consistency updates currently present in the Phase 12 working tree:

- `src/app/admin/page.tsx`
- `src/app/admin/posts/post-form.tsx`
- `src/app/admin/software/software-form.tsx`
- `src/app/free/page.tsx`
- `src/app/privacy/page.tsx`
- `src/components/software/SoftwareAccessRequestForm.tsx`

## Approval Gates

Phase 12 defines approval gates for:

- Gate A: Custom domain approval.
- Gate B: Production Supabase approval.
- Gate C: Live Stripe approval.
- Gate D: Production email approval.
- Gate E: Legal/support approval.
- Gate F: Final launch approval.

No automation may enable live Stripe, production email sending, queue/digest
scheduling, production DNS changes, custom domain primary switching, or
production data mutation without explicit approval in the current task.

## Approval Phrases Used

Live Stripe activation was permitted only after this exact approval was
provided:

> I approve enabling live Stripe subscriptions in production.

Production email activation testing was permitted only after this exact approval
was provided:

> I approve enabling production email sending.

Separate explicit approval is still required for:

- Production email queue/digest scheduling.
- Custom domain DNS or primary-domain switching.
- Production Supabase migration or environment switch.
- Production data deletion or cleanup.
- Any broader public launch decision.

## Current Production Posture

Current production URL:

- `https://trading-research-portal.netlify.app`

Current production commit observed during Phase 12:

- `12a05f056273b6b02fc2c0263915cdcc61cc7c75`

Production email:

- Active provider: Postmark.
- Production Postmark env vars were configured only after approval.
- `EMAIL_SEND_ENABLED=false` after the controlled test.
- `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`.
- `FEATURE_WEEKLY_DIGEST_ENABLED=false`.
- No production queue/digest scheduler is enabled.
- Controlled production send test succeeded.
- Production email remains safe-off for scheduler and bulk processing.

Live Stripe:

- Live Stripe was activated only after explicit approval.
- `FEATURE_CHECKOUT_ENABLED=true`.
- `FEATURE_CUSTOMER_PORTAL_ENABLED=true`.
- Live Checkout and Customer Portal remain feature-flag controlled.
- A temporary `$1` live internal test price was used for a controlled payment.
- The temporary subscription was canceled after verification.
- The temporary price was made inactive.
- The normal Premium monthly live price was restored.
- The live Stripe secret key must be rotated before broad public launch because
  it was pasted during setup.

Custom domain:

- Blocked pending owned domain and explicit domain approval.
- No DNS changes were made.
- No Netlify primary-domain switch was made.

Supabase production project:

- Owner-gated decision remains open.
- No production Supabase project migration was performed.
- No production Supabase env switch was performed.

## Live Stripe Activation Result

Activation result:

- Live Stripe production envs and feature flags were configured after explicit
  approval.
- Production deploy completed.
- `/pricing` loaded.
- `/account/billing` remained protected for anonymous users.
- `/api/stripe/webhook` rejected invalid signatures with `400`.
- No Stripe secrets were exposed in tracked files or production client assets.

Controlled checkout result:

- A temporary `$1` live internal price was used.
- Live Checkout completed.
- Return URL landed in the app.
- Webhook sync updated the app subscription.
- Account billing showed active Premium during the test.
- Access state matched the subscription update.
- The temporary subscription was canceled after verification.

Rollback readiness:

- `FEATURE_CHECKOUT_ENABLED=false` disables new Checkout starts.
- `FEATURE_CUSTOMER_PORTAL_ENABLED=false` disables Customer Portal access.
- Live Stripe env vars can be removed or rotated if needed.
- Live webhook can be disabled in Stripe if needed.
- Incident/runbook path is documented.

## Production Email Activation Result

Activation/test result:

- Postmark production env vars were configured after explicit approval.
- Initial deploy kept `EMAIL_SEND_ENABLED=false`.
- Protected API checks passed before sending.
- Sending was enabled only for a controlled test window.
- One safe test email was queued and processed.
- Provider stored as `postmark`.
- Postmark MessageID was stored.
- Postmark activity showed delivery to the approved test recipient.
- No unintended recipients were observed.
- Safe-off was restored after the test and production redeployed.

Webhook result:

- Postmark production webhook was configured to the production endpoint.
- Missing or invalid Basic Auth returned `401`.
- A real `email_provider_events` row was not observed during polling, so
  production webhook ingestion remains a Yellow follow-up until provider events
  are observed in the database.

Scheduler status:

- No production queue processor schedule is enabled.
- No production weekly digest schedule is enabled.
- Scheduler activation requires separate approval.

## Final Go/No-Go Result

Launch readiness:

- **Yellow**

Safe for public launch:

- **No**, not until launch-blocking readiness rows are updated with evidence,
  live Stripe key rotation is completed, and remaining production-readiness
  follow-ups are resolved.

Safe to enable live Stripe:

- **Yes for controlled approved testing only.**
- Broader public live billing should wait for key rotation and readiness-row
  updates.

Safe to enable production email:

- **Yes for controlled approved testing only.**
- Scheduler or broader queue processing remains blocked pending separate
  approval and webhook-ingestion confirmation.

## QA Result

Local checks passed repeatedly during Phase 12:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`

Production public route checks passed:

- `/`
- `/pricing`
- `/ideas`
- `/research`
- `/login`
- `/register`
- `/api/health`

Protected route and API checks passed:

- `/dashboard` redirects anonymous users.
- `/admin` redirects anonymous users.
- `/account/billing` redirects anonymous users.
- `/account/notifications` redirects anonymous users.
- `/api/health/deep` rejects unauthorized requests.
- `/api/stripe/webhook` rejects invalid signatures with `400`.
- `/api/email/process-queue` rejects missing secret with `401`.
- `/api/email/webhook` rejects invalid Basic Auth with `401`.

Authenticated/admin smoke passed:

- `/dashboard`
- `/admin`
- `/dashboard/software`
- `/admin/ops`
- `/admin/ops/readiness`
- `/admin/ops/stripe`
- `/admin/ops/email`
- `/admin/ops/launch`

Security checks passed:

- No tracked-file secret exposure found.
- No production HTML/client JavaScript exposure found for Supabase, Stripe,
  Postmark, email cron, or ops health secrets.
- Prohibited-feature keyword scans found only disclaimer/runbook language, not
  implemented broker/order/copy-trading features.

## Post-Launch Smoke And Rollback Drill

Created:

- `docs/runbooks/post-launch-smoke-and-rollback.md`

Drill result:

- Current production deploy was identified.
- A rollback target was identified.
- The Netlify UI rollback path was verified.
- CLI/API rollback capability was confirmed.
- No rollback was executed.
- No mock incident was created because production mutation approval was not
  provided.

Observed production deploy during drill:

- Current deploy ID: `6a1488a3779fbb91c6c75dc5`
- Commit: `12a05f056273b6b02fc2c0263915cdcc61cc7c75`
- State: ready
- Published at: `2026-05-25T17:37:23.944Z`

Selected safe rollback candidate:

- Deploy ID: `6a1486d439f53b7d9e1f9da5`
- Published at: `2026-05-25T17:29:39.939Z`

The immediately previous deploy was not selected as the preferred rollback
target because it represented a controlled email send-window deploy.

## Production Data Cleanup Plan

Created:

- `docs/runbooks/production-data-cleanup-plan.md`

Known QA/test findings:

- Two Phase 10 notify-fix trading ideas:
  - `57a6407c-5702-42e5-968f-990165fd9569`
  - `ae229284-ce08-4ff1-8ffd-0741a0bde0bb`
- Five Phase 9 Stripe webhook QA rows.
- Five matching subscription audit rows.
- Three ops event rows tied to notify-fix ideas.

No production data was deleted.

Recommended cleanup categories:

- Delete only after explicit approval.
- Unpublish if content should remain as historical QA.
- Retain audit rows if needed for billing/webhook traceability.
- Retain seed/prelaunch samples only if owner approves them as real launch
  content.

## Launch Blockers

The final go/no-go gate remained Yellow because these launch-blocking readiness
checks still need owner evidence/status updates:

- `production_admin_smoke_tested`
- `backup_restore_plan_reviewed`
- `production_supabase_project_separated_or_approved`
- `pricing_copy_reviewed`
- `live_stripe_keys_configured`
- `live_stripe_webhook_configured`
- `production_email_send_enabled_approved`
- `production_email_sender_verified`
- `production_email_spf_dkim_dmarc_reviewed`
- `software_access_model_verified`
- `premium_pro_leak_checks_passed`
- `live_stripe_legal_approved`
- `privacy_policy_reviewed`
- `production_email_legal_approved`
- `refund_policy_reviewed`
- `incident_response_runbook_reviewed`

## Remaining Risks

- Live Stripe secret key rotation is required before broad public launch.
- Production Postmark webhook ingestion should be confirmed by observing
  `email_provider_events` rows.
- Custom domain ownership and DNS plan are not complete.
- Production Supabase project decision remains owner-gated.
- QA/test records remain in the prelaunch dataset until cleanup is approved.
- Older queued `billing-access-status` notification rows should be reviewed
  before any scheduler runs.
- Readiness evidence should be entered into admin ops before a Green launch
  gate.

## Recommended Next Step

1. Rotate the live Stripe secret and update Netlify production env vars.
2. Confirm production Postmark webhook events are stored in
   `email_provider_events`.
3. Update launch-blocking readiness rows with owner-approved evidence.
4. Decide whether to keep the shared prelaunch Supabase project or create a
   dedicated production Supabase project.
5. Resolve custom domain ownership, DNS strategy, and primary-domain approval.
6. Review and approve cleanup for QA/test records before deleting anything.
7. Review older queued email rows before enabling any scheduler.
8. Run a final Green go/no-go gate after blockers are resolved.

