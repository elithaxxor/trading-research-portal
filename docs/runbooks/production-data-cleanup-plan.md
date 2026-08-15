# Production Data Cleanup Plan

Phase 12 launch-readiness data hygiene audit for the shared production/prelaunch Supabase project.

## Scope

This audit searched safe identifier and status fields for known QA/test markers before launch. No production data was deleted or mutated.

Project ref inspected: `nmdbpbvctntuwabamjjb`

Markers searched:

- `phase7`
- `phase8`
- `phase9`
- `phase10`
- `phase11`
- `qa`
- `test`
- `smoke`
- `production-qa`
- `notify-fix`

Private content fields were intentionally excluded from output. The audit did not print idea thesis/body fields, member notes, email bodies, webhook payloads, secrets, tokens, database passwords, card data, or Pine Script/source code.

## Tables Inspected

| Table | Rows inspected | QA/test matches |
| --- | ---: | ---: |
| `trading_ideas` | 6 | 2 |
| `posts` | 3 | 0 |
| `idea_updates` | 2 | 0 |
| `idea_charts` | 4 | 0 |
| `tags` | 5 | 0 |
| `software_products` | 0 | 0 |
| `software_access_requests` | 0 | 0 |
| `saved_ideas` | 0 | 0 |
| `followed_tickers` | 0 | 0 |
| `watchlist_items` | 0 | 0 |
| `member_idea_notes` | 0 | 0 |
| `email_notifications` | 0 | 0 |
| `email_digest_runs` | 0 | 0 |
| `email_unsubscribes` | 1 | 0 |
| `stripe_checkout_sessions` | 0 | 0 |
| `stripe_webhook_events` | 111 | 5 |
| `subscription_events` | 101 | 5 |
| `ops_incidents` | 0 | 0 |
| `ops_events` | 7 | 3 |

## QA/Test Records Found

| Table | ID | Title/name/slug/key | Published/status | Created at | Why it appears to be QA/test | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| `trading_ideas` | `57a6407c-5702-42e5-968f-990165fd9569` | `Phase 10 Notify Fix phase10_notify_fix_1779383364046 \| phase10-notify-fix-1779383364046-idea \| SPY` | `true \| watching \| free` | `2026-05-21T17:09:32.781102+00:00` | Matched `phase10`, `notify-fix` | Needs owner decision. Recommended: unpublish first, then delete if confirmed temporary QA content. Retain only if intentionally used as prelaunch sample content. |
| `trading_ideas` | `ae229284-ce08-4ff1-8ffd-0741a0bde0bb` | `Phase 10 Notify Fix phase10_notify_fix_1779383282387 \| phase10-notify-fix-1779383282387-idea \| SPY` | `true \| watching \| free` | `2026-05-21T17:08:16.388813+00:00` | Matched `phase10`, `notify-fix` | Needs owner decision. Recommended: unpublish first, then delete if confirmed temporary QA content. Retain only if intentionally used as prelaunch sample content. |
| `stripe_webhook_events` | `evt_phase9_past_due_1779291546961_d1906166ab13f` | `customer.subscription.updated \| evt_phase9_past_due_1779291546961_d1906166ab13f` | `processed` | `2026-05-20T15:39:07.365825+00:00` | Matched `phase9` | Retain as billing/webhook audit unless owner approves purging prelaunch test billing history. |
| `stripe_webhook_events` | `evt_phase9-webhook-qa-1779240189462_unknown_price` | `customer.subscription.updated \| evt_phase9-webhook-qa-1779240189462_unknown_price` | `processed` | `2026-05-20T01:23:14.264935+00:00` | Matched `phase9`, `qa` | Retain as billing/webhook audit unless owner approves purging prelaunch test billing history. |
| `stripe_webhook_events` | `evt_phase9-webhook-qa-1779240189462_past_due` | `customer.subscription.updated \| evt_phase9-webhook-qa-1779240189462_past_due` | `processed` | `2026-05-20T01:23:13.638129+00:00` | Matched `phase9`, `qa` | Retain as billing/webhook audit unless owner approves purging prelaunch test billing history. |
| `stripe_webhook_events` | `evt_phase9-webhook-qa-1779240189462_canceled` | `customer.subscription.deleted \| evt_phase9-webhook-qa-1779240189462_canceled` | `processed` | `2026-05-20T01:23:12.998553+00:00` | Matched `phase9`, `qa` | Retain as billing/webhook audit unless owner approves purging prelaunch test billing history. |
| `stripe_webhook_events` | `evt_phase9-webhook-qa-1779240189462_active` | `customer.subscription.updated \| evt_phase9-webhook-qa-1779240189462_active` | `processed` | `2026-05-20T01:23:11.998761+00:00` | Matched `phase9`, `qa` | Retain as billing/webhook audit unless owner approves purging prelaunch test billing history. |
| `subscription_events` | `14034d75-f18e-4ff7-96a0-f614136d12b8` | `stripe.subscription_synced \| evt_phase9_past_due_1779291546961_d1906166ab13f` | `premium \| active \| premium \| past_due` | `2026-05-20T15:39:07.471625+00:00` | Matched `phase9` | Retain as subscription audit unless owner approves purging prelaunch test billing history. |
| `subscription_events` | `e3deb0b9-2af3-4a16-8efd-a41c54ddd3ce` | `stripe.subscription_synced \| evt_phase9-webhook-qa-1779240189462_unknown_price` | `pro \| past_due \| free \| active` | `2026-05-20T01:23:14.393576+00:00` | Matched `phase9`, `qa` | Retain as subscription audit unless owner approves purging prelaunch test billing history. |
| `subscription_events` | `44b7ef6e-b1c2-4560-89cc-99571b4ba447` | `stripe.subscription_synced \| evt_phase9-webhook-qa-1779240189462_past_due` | `free \| canceled \| pro \| past_due` | `2026-05-20T01:23:13.769615+00:00` | Matched `phase9`, `qa` | Retain as subscription audit unless owner approves purging prelaunch test billing history. |
| `subscription_events` | `8592aeb8-fd38-473e-be3f-2d4f7364ac88` | `stripe.subscription_synced \| evt_phase9-webhook-qa-1779240189462_canceled` | `premium \| active \| free \| canceled` | `2026-05-20T01:23:13.13333+00:00` | Matched `phase9`, `qa` | Retain as subscription audit unless owner approves purging prelaunch test billing history. |
| `subscription_events` | `a8ecfbb4-d816-4eb7-9d99-01d26fcf851f` | `stripe.subscription_synced \| evt_phase9-webhook-qa-1779240189462_active` | `free \| none \| premium \| active` | `2026-05-20T01:23:12.167525+00:00` | Matched `phase9`, `qa` | Retain as subscription audit unless owner approves purging prelaunch test billing history. |
| `ops_events` | `675400ee-a35e-4df0-806f-187faa65b797` | `idea_viewed \| /ideas/phase10-notify-fix-1779383282387-idea \| trading_idea` | `server` | `2026-05-24T20:52:54.638642+00:00` | Matched `phase10`, `notify-fix` | Retain as ops audit unless owner approves clearing prelaunch event telemetry. If linked idea is deleted, consider retaining aggregate audit rows or clearing only after launch data-retention decision. |
| `ops_events` | `ce688792-db72-4646-8d6a-8eff2f7ce882` | `idea_viewed \| /ideas/phase10-notify-fix-1779383364046-idea \| trading_idea` | `server` | `2026-05-24T20:52:54.121271+00:00` | Matched `phase10`, `notify-fix` | Retain as ops audit unless owner approves clearing prelaunch event telemetry. If linked idea is deleted, consider retaining aggregate audit rows or clearing only after launch data-retention decision. |
| `ops_events` | `297043e4-02f2-47a0-bdf3-53901ca271a6` | `idea_viewed \| /ideas/phase10-notify-fix-1779383364046-idea \| trading_idea` | `server` | `2026-05-24T19:21:37.151161+00:00` | Matched `phase10`, `notify-fix` | Retain as ops audit unless owner approves clearing prelaunch event telemetry. If linked idea is deleted, consider retaining aggregate audit rows or clearing only after launch data-retention decision. |

## Cleanup Recommendations

### Recommended before public launch

1. Review the two `trading_ideas` rows with `phase10-notify-fix` slugs.
2. If they were only used for Phase 10 hosted notification QA, unpublish them first.
3. After confirming no intentional sample/prelaunch use, delete them and any directly dependent rows, such as linked charts, updates, tags, saved ideas, member notes, and ops events if the owner chooses a clean prelaunch dataset.

### Recommended to retain unless owner explicitly approves cleanup

- `stripe_webhook_events` rows that document Phase 9 webhook idempotency, past-due, cancellation, and unknown-price QA.
- `subscription_events` rows tied to the same Phase 9 QA events.
- `ops_events` rows if the team wants to preserve prelaunch operational telemetry.
- `email_unsubscribes` suppression/audit rows unless the owner confirms they were temporary QA and should be removed.

### Needs owner decision

- Whether to purge prelaunch Stripe/webhook/subscription audit history or retain it as launch evidence.
- Whether to clear prelaunch ops telemetry before public launch.
- Whether the shared Supabase project should be cleaned in place or replaced with a dedicated production Supabase project before launch.
- Whether QA user/profile rows should be audited separately by email/domain. This runbook intentionally did not print user emails.

## Safe Cleanup Sequence If Approved Later

No cleanup has been performed. If deletion is approved later, use this order:

1. Export or snapshot affected rows for rollback evidence.
2. Unpublish QA content before deletion so launch visitors cannot see it during cleanup.
3. Delete dependent content rows first: charts, updates, tags join rows, saved ideas, notes, watchlist references, and ops events if approved.
4. Delete the parent QA content rows.
5. Treat billing, email, unsubscribe, and webhook rows as audit records by default; purge only with explicit owner/accounting/support approval.
6. Re-run this audit and production smoke tests.

## Launch Gate

Production/prelaunch data cleanup is Yellow until the owner decides what to do with the two published Phase 10 notify-fix ideas and whether prelaunch billing/ops audit rows should be retained.
