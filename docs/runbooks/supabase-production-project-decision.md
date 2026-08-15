# Supabase Production Project Decision Runbook

This runbook supports the Phase 12 decision about whether the Trading Research
Portal should temporarily continue using the shared prelaunch Supabase project
or create a dedicated production Supabase project before launch.

It does not migrate data, create a new Supabase project, change Netlify
production environment variables, mutate production data, enable live Stripe, or
enable production email sending.

## Current Audit

Read-only audit date: 2026-05-25.

Current project refs:

- Netlify production `NEXT_PUBLIC_SUPABASE_URL` project ref:
  `nmdbpbvctntuwabamjjb`
- Netlify deploy-preview `NEXT_PUBLIC_SUPABASE_URL` project ref:
  `nmdbpbvctntuwabamjjb`
- Local linked Supabase project migration target: same applied migration set as
  the shared remote project.

Conclusion: production and deploy previews currently use the same Supabase
project.

Migration status:

- All local migrations through Phase 11 are applied remotely.
- Phase 12 has not added a schema migration.

Aggregate data audit:

- Auth users: 10 total.
- QA-like auth users: 9, based on safe pattern matching of email text only.
- Profiles: 10.
- Subscriptions: 10.
- Trading ideas: 6.
- QA-like trading ideas: 2, based on safe title/slug pattern matching.
- Research posts: 3.
- Software products: 0.
- Software access requests: 0.
- Stripe customers: 0.
- Stripe checkout sessions: 0.
- Stripe webhook events: 111.
- Subscription events: 101.
- Email notifications: 0.
- Email provider events: 1.
- Email digest runs: 0.
- Email unsubscribes: 1.
- Ops events: 7.
- Ops incidents: 0.
- Ops readiness checks: 16.

Interpretation:

- QA users remain.
- Stripe webhook/subscription audit rows remain from hosted test-mode QA.
- Email provider/unsubscribe audit rows remain from hosted Postmark QA.
- QA-like sample content remains.
- The shared project is acceptable for continued prelaunch testing only if no
  live billing, production email sending, or real member onboarding is enabled.

## Recommendation

Recommended launch path: Option B, create a dedicated production Supabase
project before collecting real users, enabling live Stripe subscriptions, or
turning on production email sending.

Option A can remain acceptable only as a short-term prelaunch posture for app
health checks, route smoke tests, and non-live QA while all production activation
flags remain safe-off.

Do not mark `production_supabase_project_separated_or_approved` as passing until
the business/technical owner explicitly approves either:

- a dedicated production Supabase project and migration plan, or
- temporary continued use of the shared project with documented launch limits.

## Option A: Continue Shared Prelaunch Project Temporarily

Description:
Keep production, deploy previews, and local linked migration workflows pointed
at the current shared Supabase project for a limited prelaunch period.

Pros:

- No immediate migration work.
- Current production app remains healthy.
- Existing deploy-preview QA data and audit rows remain available for debugging.
- Fastest path for continued safe-off route smoke testing.
- Avoids user/account mapping decisions before the business is ready.

Risks:

- Production and deploy-preview data are mixed.
- QA users and test records can be confused with launch records.
- Test Stripe webhook events and email audit rows remain in launch-adjacent
  tables.
- Mistakes in deploy-preview/admin QA could affect production-visible data.
- Future live Stripe customer/subscription records could be mixed with test
  history if launch occurs before separation.
- Email unsubscribe/suppression state from QA may not represent real users.
- Harder to make clean analytics and support decisions.

Migration steps if choosing Option A:

- Keep all production activation flags safe-off:
  - `FEATURE_CHECKOUT_ENABLED=false`
  - `FEATURE_CUSTOMER_PORTAL_ENABLED=false`
  - `EMAIL_SEND_ENABLED=false`
  - `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false`
  - `FEATURE_WEEKLY_DIGEST_ENABLED=false`
- Document the shared-project decision in `/admin/ops/readiness`.
- Label the project as prelaunch/shared in operational notes.
- Do not onboard real users.
- Do not enable live Stripe.
- Do not enable production email.
- Freeze destructive QA and admin cleanup work unless explicitly approved.
- Schedule a later production-project migration before revenue launch.

Rollback considerations:

- Disable any accidentally enabled launch flag immediately.
- Restore from backup only if an approved production mutation corrupts data.
- Use ops incidents to document any accidental test/production contamination.

Timing:

- Same day for continued prelaunch safe-off use.
- Not recommended for live paid launch.

Launch impact:

- Blocks real go-live unless the owner explicitly accepts shared-project risk.
- Must remain Yellow in launch readiness if real users/payments/email are
  expected soon.

## Option B: Create Dedicated Production Supabase Project

Description:
Create a clean production Supabase project, apply the schema, configure RLS,
decide seed/content/user migration policy, update production environment
variables, and run production smoke tests before enabling live launch features.

Pros:

- Clean separation between deploy-preview QA and production users.
- Cleaner audit logs for live Stripe, email, ops events, and support.
- Reduces risk of test users/content affecting production behavior.
- Easier backup/restore policy and incident response.
- Better legal/support posture before payments and production email.
- Better analytics quality after launch.

Risks:

- Requires careful migration and verification.
- Auth users do not automatically migrate cleanly without a deliberate decision.
- Stripe customer/subscription mapping must be treated carefully.
- Content seed/sample decisions can affect public launch readiness.
- Environment switch mistakes can cause production outages.
- Extra smoke testing is required after the switch.

Migration steps:

1. Create production Supabase project only after explicit approval.
2. Record the production project ref in a private ops note; do not commit
   secrets.
3. Apply schema migrations in order:
   - `supabase/migrations/20260516144957_initial_schema.sql`
   - every subsequent migration through the latest approved phase.
4. Regenerate database types from the production project only if the production
   schema is intended to become authoritative.
5. Verify RLS:
   - anonymous content reads
   - authenticated free user access
   - Premium access
   - Pro access
   - admin-only access
   - software request isolation
   - email notification privacy
   - ops/admin-only table access
6. Decide seed/sample content policy:
   - no sample content,
   - curated launch content only, or
   - migrate selected prelaunch content after review.
7. Decide Auth user policy:
   - start fresh for production, or
   - migrate selected real users after explicit approval.
8. Decide subscription/customer policy:
   - do not migrate test Stripe customers or sessions.
   - do not migrate test subscription audit rows.
   - live Stripe should create new production customer/subscription mappings
     after live approval.
9. Decide email policy:
   - do not migrate QA email notifications, provider events, unsubscribes, or
     suppressions unless there is an explicit reason.
   - production email remains disabled until Postmark/legal approval.
10. Update Netlify production environment variables only after approval:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
    - `SUPABASE_SECRET_KEY`
11. Keep deploy-preview pointed at the prelaunch/test project unless a separate
    preview project is also approved.
12. Trigger a fresh Netlify production deploy.
13. Run production smoke tests.

Rollback considerations:

- Keep the previous shared project unchanged until production smoke passes.
- Keep previous Netlify env values recoverable in the Netlify UI/history or
  private ops vault.
- If production breaks after the env switch, restore previous Supabase env vars,
  redeploy, and confirm `/api/health` plus public/protected routes.
- Keep live Stripe and production email disabled during the project switch.

Timing:

- Plan: 0.5-1 day for approval and checklist prep.
- Execute: 1-2 hours for schema/env/deploy if no data migration is needed.
- Verify: 1-3 hours for smoke, RLS, auth, admin, billing safe-off, email
  safe-off, and leak checks.
- Longer if selected users/content must be migrated.

Launch impact:

- Best path for a clean production launch.
- Should be completed before live Stripe or production email activation.
- Lets deploy-preview remain a safer QA environment.

## Production Smoke Test Plan For Option B

After an approved production project switch:

- `/api/health` returns OK.
- `/api/health/deep` works only with admin or `OPS_HEALTH_SECRET`.
- Public routes load:
  - `/`
  - `/pricing`
  - `/ideas`
  - `/research`
  - `/login`
  - `/register`
- Anonymous protected routes redirect:
  - `/dashboard`
  - `/account`
  - `/account/billing`
  - `/account/notifications`
  - `/admin`
  - `/admin/ops`
- Auth flows:
  - register
  - login
  - logout
  - password reset
  - auth callback
- Access checks:
  - free content visible
  - Premium/Pro panels locked for free users
  - no private chart metadata leaks
  - no Pine Script/source code leaks
- Admin checks:
  - admin dashboard loads
  - ops readiness pages load
  - no regular user admin access
- Billing safe-off:
  - checkout remains disabled unless separately approved.
  - Customer Portal remains disabled unless separately approved.
  - Stripe webhook invalid signature returns 400.
- Email safe-off:
  - production email sending remains disabled.
  - queue/digest APIs reject missing secret.
  - Postmark webhook rejects missing/invalid Basic Auth.
- Secret leak checks:
  - no Supabase secret in HTML/client JS.
  - no Stripe secret in HTML/client JS.
  - no Postmark secret in HTML/client JS.
  - no email cron or ops health secret in HTML/client JS.

## Readiness Evidence Guidance

Do not update `/admin/ops/readiness` unless a current task explicitly approves
the mutation.

If approved later, update the
`production_supabase_project_separated_or_approved` readiness row with:

- selected option,
- project ref evidence, masked if needed,
- owner,
- date,
- rollback owner,
- backup/restore status,
- smoke test result,
- remaining caveats.

Do not mark the row `passing` until either Option A is explicitly accepted for
the launch scope or Option B is implemented and production smoke tests pass.

## Decision Needed

Next approval needed:

> I approve Gate B production Supabase posture for launch. The intended
> Supabase project is approved, backup/restore expectations are reviewed, and
> the rollback owner is assigned.

Recommended wording if approving a dedicated production project:

> I approve Option B: create a dedicated production Supabase project before live
> Stripe, production email, or real member launch. Do not switch Netlify
> production env vars until the migration checklist is complete and I approve
> the env switch.

Recommended wording if temporarily accepting the shared project:

> I approve Option A: continue using the shared prelaunch Supabase project
> temporarily for safe-off production. Live Stripe, production email sending,
> real member onboarding, and production data mutation remain blocked until a
> separate approval.
