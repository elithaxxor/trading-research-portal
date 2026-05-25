# Custom Domain Readiness Runbook

This runbook prepares a custom domain for the Trading Research Portal. It does
not approve DNS changes, switch the production primary domain, enable live
Stripe, enable production email sending, enable schedulers, or mutate production
data.

## Current Status

Intended custom domain: `TBD`.

Readiness status: blocked until a domain is purchased or selected and explicitly
approved through Gate A in `docs/phase-12-launch-plan.md`.

Current Netlify site audit:

- Netlify site name: `trading-research-portal`
- Current production URL: `https://trading-research-portal.netlify.app`
- Current Netlify default domain: `trading-research-portal.netlify.app`
- Current production branch deploy URL:
  `https://main--trading-research-portal.netlify.app`
- Latest known deploy-preview URL:
  `https://deploy-preview-13--trading-research-portal.netlify.app`
- Current Phase 12 branch deploy URL: not available until this branch is pushed
  and a deploy preview exists.
- Custom domain attached: no.
- Domain aliases attached: no.
- Netlify DNS zone records for this site: none returned by the read-only audit.
- HTTPS: active for the default `.netlify.app` production domain. No custom
  domain certificate is provisioned because no custom domain is attached.
- Apex/www redirect strategy: not configured because no custom domain is
  attached.

## Approval Required

No DNS records may be changed and no Netlify production primary domain may be
added or switched without explicit approval in the current task.

Required wording before custom domain preparation:

> I approve Gate A custom domain preparation for production. I approve the
> named domain, DNS owner, target Netlify site, rollback owner, and test window.

Required wording before primary domain switching:

> I approve switching the custom domain primary production traffic now.

## Domain Options

### Option 1: Netlify DNS

Use Netlify name servers for the domain. Netlify manages DNS records and can
automate more of the apex, `www`, HTTPS, and branch-subdomain behavior.

Best fit:

- New domain with no existing DNS dependencies.
- Owner wants Netlify to manage the DNS zone.
- Future branch subdomains such as `staging.example.com` may be useful.

Tradeoffs:

- Name servers must be changed at the registrar.
- Any existing DNS records, email records, or third-party service records must
  be recreated carefully in Netlify DNS before switching.

### Option 2: External DNS Pointed To Netlify

Keep the DNS provider at the registrar or current DNS host, and point approved
records to Netlify.

Best fit:

- Domain already has DNS records elsewhere.
- Owner wants to keep DNS management outside Netlify.
- Email/DNS records are already established with another provider.

Tradeoffs:

- DNS records must be entered manually.
- HTTPS may require DNS propagation before certificates can be issued.
- Apex domains are less flexible with external DNS than `www` subdomains.

## Apex vs www Strategy

Recommended launch strategy:

- Use `www.<domain>` as the primary public domain when using external DNS.
- Redirect the apex `<domain>` to `www.<domain>`.
- Keep `https://trading-research-portal.netlify.app` available as a rollback
  URL.

Alternative:

- Use the apex `<domain>` as the primary domain and redirect `www` to apex.
- Prefer this only if the DNS provider supports resilient apex records or if
  Netlify DNS will manage the zone.

Netlify automatically pairs apex and `www` entries when either is assigned as a
production domain, and redirects the alternate host to the selected primary
domain. With external DNS, Netlify recommends using `www` or another subdomain
as the primary domain.

## DNS Records Needed After Approval

Do not create these records until Gate A approval is explicit.

For external DNS with `www` as primary:

- Add the custom domain in Netlify Domain management first.
- `www` record:
  - Type: `CNAME`
  - Host/name: `www`
  - Target/value: `trading-research-portal.netlify.app`
- Apex record:
  - Preferred if supported: `ALIAS`, `ANAME`, or flattened `CNAME`
  - Host/name: `@` or blank, depending on provider
  - Target/value: `apex-loadbalancer.netlify.com`
  - Fallback if ALIAS/ANAME/flattening is unavailable:
    - Type: `A`
    - Host/name: `@` or blank
    - Target/value: `75.2.60.5`

For Netlify DNS:

- Add or bring the domain to Netlify.
- Confirm all needed records are present before delegating name servers.
- Update registrar name servers to the Netlify-provided name servers only after
  approval.
- Recreate required email/provider records, including any Postmark SPF/DKIM,
  DMARC, MX, or verification records, before relying on the domain.

Propagation expectations:

- DNS propagation may take several hours.
- Plan for 24-48 hours before treating the custom domain as launch-ready.
- Keep the Netlify subdomain reachable during propagation.

## HTTPS Certificate Readiness

Before switching primary production traffic:

- Custom domain must be attached to the correct Netlify site.
- DNS must point to Netlify and pass Netlify verification.
- Netlify HTTPS certificate must be provisioned successfully.
- Both apex and `www` should be tested over HTTPS.
- Mixed-content and redirect loops should be checked.

Do not launch on a custom domain if the HTTPS certificate is pending, failed,
or only partially covering the selected apex/`www` strategy.

## App Config Updates After Domain Approval

These updates are preparation notes only. Do not change production config until
domain approval is explicit.

### Netlify

- Update production `NEXT_PUBLIC_SITE_URL` to the approved primary HTTPS domain.
- Confirm production deploy context, not deploy-preview, receives the value.
- Keep secrets server-only.
- Trigger a fresh production deploy only after approval.

### Supabase Auth

- Update Supabase Auth Site URL to the approved primary HTTPS domain.
- Add redirect URLs:
  - `https://<approved-domain>/auth/callback`
  - `https://www.<approved-domain>/auth/callback` if `www` is used.
  - Keep existing Netlify production and deploy-preview callback URLs as needed
    during transition.
- Verify login, register, password reset, and email confirmation redirects.

### Stripe

- Confirm Checkout success and cancel URLs use the current request origin where
  possible.
- If any Stripe fallback site URL is configured, update it to the approved
  production domain only after approval.
- Update or add production Stripe webhook endpoint:
  - `https://<approved-domain>/api/stripe/webhook`
- Keep live Stripe disabled until Gate C and final launch approval.

### Postmark And Email Links

- Update production link generation to use the approved production domain via
  `NEXT_PUBLIC_SITE_URL`.
- Confirm unsubscribe links use the approved HTTPS domain.
- Confirm Postmark webhook endpoint if the domain is changed:
  - `https://<approved-domain>/api/email/webhook`
- Keep `EMAIL_SEND_ENABLED=false` and
  `FEATURE_PRODUCTION_EMAIL_SENDING_ENABLED=false` until Gate D and final send
  approval.

### Canonical Metadata

- Confirm metadata uses `NEXT_PUBLIC_SITE_URL` or safe request-derived origins.
- Verify canonical URLs on public routes:
  - `/`
  - `/pricing`
  - `/ideas`
  - `/research`
  - `/terms`
  - `/privacy`
  - `/refund-policy`
  - `/disclaimer`

## Validation Checklist

Before primary switch:

- Domain is approved and owner is documented.
- DNS provider path is chosen.
- Apex/`www` primary strategy is chosen.
- DNS records are ready but not applied until approved.
- Netlify custom domain attachment is planned.
- HTTPS certificate plan is understood.
- `NEXT_PUBLIC_SITE_URL` update plan is documented.
- Supabase Auth URL updates are planned.
- Stripe webhook/domain updates are planned but live billing remains disabled.
- Postmark link/webhook updates are planned but production sending remains
  disabled.
- Rollback owner is available.

After approved DNS/custom-domain changes:

- `https://<approved-domain>/api/health` returns OK.
- Public routes return 200.
- Anonymous protected routes redirect to login.
- Supabase Auth login/register/reset flows work.
- Stripe webhook invalid signature returns 400.
- Postmark webhook invalid Basic Auth returns 401.
- No secrets appear in HTML or client JavaScript.
- Netlify subdomain remains available for rollback.

## Rollback Strategy

If custom-domain launch fails:

- Revert Netlify primary domain to `trading-research-portal.netlify.app`.
- Restore previous `NEXT_PUBLIC_SITE_URL` if it was changed.
- Keep live Stripe disabled.
- Keep production email sending disabled.
- Pause any approved schedulers.
- Remove or adjust DNS records only with owner approval.
- Confirm `/api/health` and public routes are healthy on the Netlify subdomain.
- Record the failure and rollback evidence in `/admin/ops/incidents`.

## References

- Netlify external DNS setup:
  https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/
- Netlify domain setup overview:
  https://docs.netlify.com/manage/domains/get-started-with-domains/
- Netlify multiple domain and apex/www behavior:
  https://docs.netlify.com/manage/domains/manage-domains/manage-multiple-domains/
