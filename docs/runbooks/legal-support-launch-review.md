# Legal, Policy, Pricing, Support, And Risk Launch Review

This runbook records a non-legal copy audit for launch readiness. It is not
legal advice and does not claim legal or business approval is complete.

Production email sending and live Stripe subscriptions remain disabled until
the relevant Phase 12 approval gates are complete.

## Review Status

Review date: 2026-05-25.

Overall status: Yellow / needs human legal and business review.

No reviewed copy should be treated as final legal approval. The current copy is
consistent enough for safe-off prelaunch operation, but live subscriptions,
production email sending, and launch announcements still require human approval.

## Pages And Surfaces Reviewed

Public pages:

- `/pricing`
- `/disclaimer`
- `/terms`
- `/privacy`
- `/refund-policy`
- `/contact`
- footer navigation and footer disclaimer copy
- `/free` email-update preview copy

Authenticated/account surfaces:

- `/account/billing`
- `/account/notifications`
- `/dashboard/software`
- `/dashboard/software/[slug]`

Email notification surfaces:

- base email layout and footer disclaimer
- billing/access status template
- software access status template
- content/lifecycle/digest templates
- unsubscribe/preference links

Admin/support surfaces:

- admin dashboard notes
- admin research post publishing copy
- admin software file URL copy
- software access request copy

## Copy Changes Made

Obvious consistency updates were made:

- `/privacy`: replaced outdated language saying email notification backend work
  is not part of the current phase. The page now states email infrastructure
  exists, production sending is disabled, and email addresses may support auth,
  billing records, notification preferences, unsubscribe records, and support.
- `/free`: replaced outdated "planned for a later phase" email copy with
  safe-off production launch language.
- `SoftwareAccessRequestForm`: removed Phase 8-specific wording and clarified
  that the portal records manual TradingView access requests but does not
  automate TradingView permissions.
- Admin dashboard notes: replaced stale "Stripe billing not active" and
  "TradingView chart embeds not active" notes with current test-mode billing,
  webhook, and manual-invite posture.
- Admin research post form: clarified that publishing a post does not send
  research-post email alerts directly.
- Admin software form: replaced Phase 8-specific protected-storage language with
  current safe file URL guidance.

## Findings

### Pricing

Current status:

- Pricing page clearly states payments are processed by Stripe.
- Subscriptions renew until canceled.
- Access updates after successful Stripe payment and webhook processing.
- No plan guarantees trading results.
- The portal does not connect to brokers, execute orders, or provide
  copy-trading automation.
- Premium unlocks Premium content and Lite software.
- Pro unlocks Premium/Pro content and Lite + Pro software.
- TradingView invite-only access may require manual admin approval.

Needs human review:

- Final public price labels before live subscriptions.
- Exact cancellation language.
- Whether annual/monthly plan copy matches the live Stripe products/prices.
- Whether Stripe Customer Portal plan-change behavior is final.

### Disclaimer

Current status:

- Educational purpose is clear.
- Not financial, investment, legal, or tax advice.
- Trading risk and loss of capital are stated.
- No guaranteed results language is present.
- User responsibility is stated.
- Subscription access does not remove trading risk.
- No broker/order/copy-trading/live market data language is clear.

Needs human review:

- Position disclosure policy and update cadence.
- Whether additional jurisdiction-specific disclaimers are needed.

### Terms

Current status:

- Educational/informational purpose is stated.
- No guaranteed results language is stated.
- Subscription/member access model is described.
- Stripe webhook-confirmed billing state is described as source of access
  changes.
- No broker/order/copy-trading/automatic TradingView invite automation is
  stated.

Needs human review:

- Final enforceable terms.
- Payment, cancellation, refund, account termination, acceptable use, support,
  dispute, governing law, and limitation of liability language.

### Privacy

Current status:

- Supabase account/dashboard data categories are described.
- Stripe is identified as the payment processor.
- The portal says it stores billing metadata but not card numbers or raw payment
  method details.
- Software access requests may include TradingView username and member notes.
- Email notification infrastructure and disabled production-sending posture are
  now reflected.

Needs human review:

- Final disclosures for Supabase, Stripe, Postmark, PostHog, Sentry, operational
  logging, cookies/session handling, retention, deletion, data rights, and
  support workflows.

### Refund And Cancellation

Current status:

- Refund/cancellation page exists.
- Stripe-hosted subscription billing is described.
- Subscriptions renew until canceled.
- Stripe handles card storage, payment collection, receipts, and billing
  management.
- No performance refunds/results framing is avoided.
- Page explicitly says final refund eligibility, cancellation timing, support
  procedure, and jurisdiction-specific terms need review before live
  subscriptions.

Needs human review:

- Final refund eligibility.
- Cancellation timing and access end date.
- Whether partial refunds are allowed.
- Support process and response expectations.
- Tax and jurisdiction-specific obligations.

### Contact And Support

Current status:

- Contact page says billing self-service is handled through Stripe-hosted tools.
- It says direct support channel and response process must be finalized before
  live subscription launch.

Needs human review:

- Approved support email/inbox.
- Response-time expectations.
- Support owner for billing, refunds, cancellations, unsubscribe issues,
  software access, and TradingView manual invite questions.

### Footer

Current status:

- Footer links include pricing, disclaimer, terms, privacy, contact, and refund
  policy.
- Footer states content is educational and not financial advice.

Needs human review:

- Final company/entity name, copyright owner, domain, and legal footer details.

### Account Billing

Current status:

- Billing page describes Stripe-backed subscription status and Stripe-hosted
  billing management.
- It states tier/status changes are applied by verified Stripe webhook events.
- It states users cannot manually change tier from the page.
- It warns access changes may take a short delay while webhook processing
  completes.

Needs human review:

- Whether final Customer Portal capabilities match copy for plan changes,
  cancellations, and payment method updates.

### Email Notification Copy

Current status:

- Notification preferences page says optional content/digest emails can be
  changed any time.
- Transactional software/billing/account emails are described separately.
- Email templates include unsubscribe/preference links where appropriate.
- Base template includes educational/no-advice/no-results disclaimer.
- Billing/access email says Stripe handles receipts and card/payment emails.
- Software access email says TradingView invite-only access may require manual
  approval and private implementation files are not sent by email.

Needs human review:

- Final production email notification language.
- Whether transactional email categories are considered essential.
- Unsubscribe/support workflow.
- Privacy policy coverage for Postmark and email event logging.

### Software Access Copy

Current status:

- Premium/Pro software access rules are clear.
- Software is described as educational research tooling.
- Copy states software is not financial advice, trade execution, or a guarantee
  of results.
- TradingView invite-only access is manual/admin-managed.
- Private Pine Script/source code is not emailed by templates and admin copy
  warns against pasting private Pine source into documentation.

Needs human review:

- Final support process for software access requests.
- TradingView manual approval expectations and user communication.
- Any software license/usage terms.

## Launch-Readiness Checklist

Mark these only after human review:

- [ ] Terms reviewed.
- [ ] Privacy reviewed.
- [ ] Refund policy reviewed.
- [ ] Cancellation policy reviewed.
- [ ] Disclaimer reviewed.
- [ ] Support process reviewed.
- [ ] Pricing reviewed.
- [ ] Email notification copy reviewed.
- [ ] Software access copy reviewed.
- [ ] No guaranteed returns language confirmed.
- [ ] No personalized financial advice claims confirmed.
- [ ] No broker integration claims confirmed.
- [ ] No order execution claims confirmed.
- [ ] No copy-trading claims confirmed.
- [ ] No live market data feed claims confirmed.
- [ ] No unsupported tax claims confirmed.
- [ ] Stripe receipts/payment email distinction reviewed.
- [ ] TradingView invite-only manual workflow reviewed.
- [ ] Unsubscribe/support workflow reviewed.

## Red Flags To Recheck Before Launch

- Any phrase implying guaranteed returns, expected profit, or performance
  assurance.
- Any phrase implying personalized investment advice.
- Any phrase implying the portal places trades, connects to brokers, manages
  accounts, or provides copy trading.
- Any phrase implying live market data is supplied by the portal.
- Any phrase implying TradingView invite-only access is automatic.
- Any pricing text that does not match live Stripe prices.
- Any refund/cancellation promise not approved by the business/legal owner.
- Any tax statement not reviewed by the appropriate professional.
- Any email or notification copy without unsubscribe/support clarity.

## Readiness Row Guidance

Do not mark legal/support readiness checks as passing unless a current task
explicitly approves the mutation and the human review evidence is documented.

Relevant readiness rows:

- `pricing_copy_reviewed`
- `refund_policy_reviewed`
- `privacy_policy_reviewed`
- `live_stripe_legal_approved`
- `production_email_legal_approved`

Recommended status until approval: `pending` or `warning`.

## Required Approval Wording

Use the Phase 12 Gate E approval wording before marking legal/support launch
readiness as approved:

> I approve Gate E legal and support launch readiness. Terms, privacy, refund,
> cancellation, pricing, risk disclaimers, email language, and support ownership
> are approved for the named launch window.
