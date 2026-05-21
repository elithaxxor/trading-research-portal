# Trading Research Portal

A professional trading research portal built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Netlify, and Supabase.

The public site is live as a marketing experience. Supabase schema, RLS, seed data, typed client utilities, Phase 3 authentication, Phase 4 content routes, Phase 5 admin content management, Phase 6 TradingView chart display, Phase 7 idea lifecycle refinement, Phase 8 advanced member dashboard/software library implementation, and Phase 9 Stripe subscription implementation are in place for development. Phase 9 hosted Stripe test-mode deploy-preview QA has passed for Checkout, Customer Portal, webhook sync, idempotency, cancellation, payment-failure access downgrade, and access automation. Broker integrations, order execution, copy trading, automatic TradingView invite automation, and email notification backend work remain intentionally out of scope for the current build.

## Phase Status

- Phase 0: Complete. Project foundation, Netlify configuration, dark financial design system, and deployment baseline are in place.
- Phase 1: Complete. Public marketing routes, legal/support pages, metadata, and responsive polish are in place.
- Phase 2: Complete. Supabase packages, CLI structure, migrations, RLS policies, seed data, environment structure, client utility scaffolding, remote migration verification, and generated database types are in place.
- Phase 2.5: Complete. Supabase schema/RLS verification passed, including anonymous read/write smoke tests and authenticated RLS validation for free, premium, pro, and admin access.
- Phase 3: Complete. Supabase Auth, SSR cookie sessions, protected routes, auth callback, password reset, and account/dashboard shells are implemented and verified.
- Phase 4: Complete. Supabase-backed free, premium, and pro content previews, detail pages, access-aware rendering, dashboard content widgets, and deploy-preview access-control QA are in place.
- Phase 5: Complete. Admin dashboard routes, admin-only authorization, trading idea management, research post management, updates, chart metadata, tags, and tag assignment are implemented and verified. Live admin-session CRUD QA, public regression QA, premium/pro leak checks, post-rotation smoke testing, and cleanup passed.
- Phase 6: Complete. TradingView chart widgets render from safe `idea_charts` metadata on full-access idea pages, locked premium/pro chart details remain protected, admin chart previews and validation are in place, and deploy-preview chart QA has passed.
- Phase 7: Complete. Structured idea lifecycle states, outcome tracking, closed idea reviews, lifecycle-aware public timelines, admin lifecycle controls, member new-since-last-visit foundation, and dashboard lifecycle widgets are implemented and deploy-preview QA has passed.
- Phase 8: Complete. Advanced member dashboard routes, saved ideas, followed tickers, watchlist workflows, dashboard preferences, member notes, recent activity, closed reviews, gated software library, software access requests, and admin software management are implemented and verified. Anonymous and authenticated deploy-preview QA, user-owned RLS isolation, software access-control checks, admin software management QA, leak checks, mobile QA, cleanup, and local build/lint/typecheck all passed.
- Phase 9: Complete. Stripe Checkout, Customer Portal, webhook route, billing schema migration, subscription sync helpers, pricing/account billing UI, and webhook-driven Premium/Pro access automation are implemented. Phase 9 migrations are applied, generated types are updated, hosted Stripe test-mode Checkout and Customer Portal QA passed, webhook sync/idempotency/cancellation/payment-failure downgrade QA passed, and access automation/leak checks passed.

## Phase 1 Public Site

Completed public routes:

- `/` homepage
- `/pricing`
- `/about`
- `/free`
- `/disclaimer`
- `/login`
- `/register`

Completed UI foundation:

- Site header and mobile navigation
- Site footer
- Shared layout container
- Page hero sections
- Reusable section headings
- Pricing cards
- Feature grids
- Static trading idea preview card
- CTA sections
- Disclaimer banner
- Free vs Premium comparison table
- Stat cards
- Dark financial design system
- Page-level metadata and Open Graph placeholders
- Auth routes now use real Supabase Auth forms in Phase 3

Public content explains the educational research model, risk limitations, and subscription access paths. Premium and Pro access automation is implemented through Stripe test-mode Checkout and verified webhook sync; live subscriptions still require final live-key setup and business/legal approval.

## Local Development

Use Node 22 locally to match Netlify.

Install dependencies:

```bash
npm ci
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run a production build:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Netlify Deployment

The project includes `netlify.toml` with the required build settings:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"
```

Deployment checklist:

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Create or connect the site in Netlify.
3. Confirm the build command is `npm run build`.
4. Confirm the publish directory is `.next`.
5. Confirm Node is set to version `22`.
6. Let Netlify detect the Next.js runtime automatically.
7. Do not pin `@netlify/plugin-nextjs` unless a future deployment issue specifically requires it.
8. Store real secrets in the Netlify UI, not in committed files.
9. Deploy and review the build log for the first real error if deployment fails.

Routing note: the temporary internal-output redirects for `/server/app/*.html`
have been removed. A Netlify draft deploy using the Next.js runtime verified
that the public routes resolve through Netlify's generated Next server handler
without those manual rewrites. A Git-backed branch deploy should still be
configured before Phase 2 work moves beyond planning.

## Environment Variables

Public marketing pages can build without Supabase variables, but Phase 3 authentication requires Supabase variables when auth routes or protected pages are used.

Real Supabase values must be stored locally in `.env.local` and in Netlify environment variables. Never commit secret keys, service-role keys, or production credentials.

Current Supabase placeholders in `.env.example`:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Legacy Supabase projects may still expose anon/service-role key names. Use those fallback names only when needed for an older key setup, and never commit their values:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Auth UI, protected routes, SSR session refresh, and account/dashboard shells are implemented in Phase 3. Payment and billing features come later.

Phase 9 Stripe placeholders in `.env.example`:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_MONTHLY_PRICE_ID=
STRIPE_PREMIUM_ANNUAL_PRICE_ID=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
```

Optional public pricing label placeholders may be used for display copy only.
They are not a source of truth for access control or billing:

```bash
NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL=
NEXT_PUBLIC_PREMIUM_ANNUAL_PRICE_LABEL=
NEXT_PUBLIC_PRO_MONTHLY_PRICE_LABEL=
NEXT_PUBLIC_PRO_ANNUAL_PRICE_LABEL=
```

Phase 10 email provider placeholders in `.env.example`:

```bash
EMAIL_PROVIDER=resend
EMAIL_SEND_ENABLED=false
EMAIL_FROM=
EMAIL_REPLY_TO=
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
EMAIL_CRON_SECRET=
EMAIL_TEST_RECIPIENT=
```

`EMAIL_PROVIDER=resend` selects the default provider while keeping the app
behind an email-provider abstraction so Postmark can be swapped in later if
needed. `EMAIL_SEND_ENABLED=false` means email workflows should queue/log only
and must not actually send. `EMAIL_TEST_RECIPIENT` can be used during
deploy-preview QA to redirect non-transactional test email to a safe inbox.
`EMAIL_CRON_SECRET` protects manual or scheduled digest and queue-processing
routes. `RESEND_API_KEY` and `RESEND_WEBHOOK_SECRET` are server-only and must
never be imported into client components or committed.

## Supabase Local Development

Phase 2 introduced Supabase CLI project files and migrations for schema work.
Phase 4 and Phase 5 now use Supabase-backed content and admin routes, so local
content/auth testing requires a real development `.env.local`.

Useful commands:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:types
npm run supabase:stop
```

Migration workflow:

1. Create reviewed SQL migrations under `supabase/migrations/`.
2. Use `npm run supabase:reset` locally to replay migrations against the local database.
3. Regenerate local TypeScript database types with `npm run supabase:types` after schema changes.
4. Review migrations before pushing them to any production Supabase project.

Seed data lives in `supabase/seed.sql` for local development only. The seed
records are educational sample content for testing the schema and RLS model;
they are not financial advice, trading recommendations, performance claims, or
production research.

Do not run remote `db push` or apply production migrations until the schema,
Row Level Security policies, and access model have been reviewed.

## Phase 2 Data Model

The initial schema includes:

- `profiles`: user profile metadata linked to Supabase Auth users.
- `subscriptions`: subscription tier/status metadata for future billing integration.
- `trading_ideas`: structured research cards with ticker, thesis, visibility, status, risk, and publication fields.
- `idea_updates`: timestamped updates for a trading idea.
- `idea_charts`: chart metadata for future TradingView/image/lightweight chart integrations.
- `posts`: market commentary, educational posts, and chart breakdown content.
- `tags`: reusable content labels.
- `idea_tags`: many-to-many link table between ideas and tags.
- `watchlist_items`: user-owned watchlist records.
- `email_notifications`: future notification tracking records.

## RLS Model

Row Level Security is enabled for all public schema tables.

- Published free content can be read publicly.
- Premium and pro content require an authenticated user with sufficient access.
- Admins can manage content, subscriptions, tags, and notification records.
- Users can read their own profile, subscription, watchlist, and notification records.
- Users can create, update, and delete their own watchlist items.
- The admin Supabase client is server-only, uses the secret/service-role key, bypasses RLS, and must never be imported into client components.

## Phase 3 Auth System

Phase 3 uses Supabase Auth with SSR cookie-based sessions in the Next.js App Router.

Implemented auth pieces:

- Supabase email/password registration and login.
- Server actions for sign in, sign up, sign out, password reset request, and password update.
- Next.js 16 `proxy.ts` session refresh and route protection.
- Protected `/dashboard` route.
- Protected `/account` route.
- `/auth/callback` route for Supabase email confirmation and password recovery redirects.
- `/forgot-password` and `/reset-password` flows.
- Auth-aware public navigation.
- Safe user bootstrap for `profiles` and free `subscriptions` rows.

Protected routes:

- `/dashboard`
- `/account`

Unauthenticated users are redirected to `/login?redirectedFrom=<path>`.
Authenticated users visiting `/login` or `/register` are redirected to `/dashboard`.

Create a local `.env.local` file with real development project values. Do not commit this file.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=<your-dev-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_SECRET_KEY=<server-only-secret-key>
```

The repository ignores `.env`, `.env.local`, `.env.development`, and
`.env.production` through the `.env*` rule in `.gitignore`, while still allowing
`.env.example` to be committed.

Supabase dashboard checklist:

1. Set the local development Site URL to `http://localhost:3000`.
2. Add the local auth redirect URL: `http://localhost:3000/auth/callback`.
3. Add the current Netlify deploy-preview callback URL when testing hosted auth: `https://deploy-preview-7--trading-research-portal.netlify.app/auth/callback`.
4. Add a Netlify deploy-preview redirect pattern if supported by the Supabase project settings: `https://*.netlify.app/auth/callback`.
5. Add the production Netlify redirect URL before merging to production: `https://trading-research-portal.netlify.app/auth/callback`.
6. Add the custom-domain production redirect URL once a custom domain is available: `https://YOUR_DOMAIN.com/auth/callback`.

Auth email redirects are built from the current request origin when available.
This lets deploy previews generate callback URLs for their own preview domain
instead of falling back to `NEXT_PUBLIC_SITE_URL`. `NEXT_PUBLIC_SITE_URL` remains
the fallback for static metadata and non-request contexts, and localhost is used
only as a local-development fallback.

Netlify environment variable checklist:

```bash
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

Phase 9 Stripe environment checklist:

- `STRIPE_SECRET_KEY` must be stored only in local `.env.local` and Netlify server/runtime environment variables.
- `STRIPE_WEBHOOK_SECRET` must be stored only in local `.env.local` and Netlify server/runtime environment variables.
- `STRIPE_PREMIUM_MONTHLY_PRICE_ID`, `STRIPE_PREMIUM_ANNUAL_PRICE_ID`, `STRIPE_PRO_MONTHLY_PRICE_ID`, and `STRIPE_PRO_ANNUAL_PRICE_ID` must be configured per environment.
- Stripe test mode and live mode keys, webhook secrets, products, and price IDs must not be mixed.
- Stripe secret keys and webhook secrets must never be exposed to client components.
- Stripe keys, webhook secrets, and real price IDs must never be committed.
- Checkout and the Customer Portal are Stripe-hosted flows.
- Subscription tier changes in Supabase must be driven by verified Stripe webhook events, not by frontend clicks or client-submitted tier values.

Phase 10 email environment checklist:

- Configure email variables separately in local `.env.local`, Netlify Deploy
  Preview context, and Netlify Production context.
- Keep `EMAIL_SEND_ENABLED=false` until provider-domain verification, email QA,
  unsubscribe handling, event logging, and leak checks pass.
- `EMAIL_PROVIDER` defaults to `resend`; provider-specific APIs should stay
  behind server-side email utilities so another provider such as Postmark can be
  added later.
- `EMAIL_FROM` must use a verified sender/domain before real sending is
  enabled.
- `EMAIL_REPLY_TO` should be a monitored support inbox when configured.
- `EMAIL_TEST_RECIPIENT` may redirect deploy-preview non-transactional test
  messages to a safe inbox.
- `EMAIL_CRON_SECRET` must protect any manual or scheduled digest and queue
  processing routes.
- Phase 10 queue processing is exposed through protected POST endpoints:
  `/api/email/process-queue` processes a limited batch of queued emails and
  `/api/email/digest/weekly` builds and queues weekly digests. Both require
  `EMAIL_CRON_SECRET` via `Authorization: Bearer ...`, `x-email-cron-secret`,
  or `x-cron-secret`; responses return safe counts only, never recipients.
- These endpoints can be triggered manually, by a scheduler, or by a future
  scheduled function. Supabase Cron or another scheduler can call the protected
  endpoint later, but production cron is not configured until explicitly
  approved.
- Do not expose `EMAIL_CRON_SECRET` in client code, logs, README examples, or
  browser-visible configuration.
- `RESEND_API_KEY` and `RESEND_WEBHOOK_SECRET` are server-only values for
  Netlify runtime/functions and local `.env.local`; never expose them to the
  browser or commit them.
- Production sending should remain disabled until Phase 10 QA passes and
  business approval is complete.

For deploy previews, `NEXT_PUBLIC_SITE_URL` must not be set to localhost. It can
be the production Netlify URL while auth server actions use the current preview
request origin for email confirmation and password reset callbacks.

Production Netlify environment checklist before merging protected or
Supabase-backed features:

```bash
NEXT_PUBLIC_SITE_URL=https://trading-research-portal.netlify.app
NEXT_PUBLIC_SUPABASE_URL=<your-production-or-approved-prelaunch-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-production-or-approved-prelaunch-publishable-key>
SUPABASE_SECRET_KEY=<server-only-production-or-approved-prelaunch-secret-key>
```

Use `https://trading-research-portal.netlify.app` as the production site URL
until a custom domain is active. If the development Supabase project is reused
temporarily for production testing, treat that as pre-launch only and create a
separate production Supabase project before collecting real users, payments, or
production research data.

Public `NEXT_PUBLIC_*` values may be used by browser clients. Secret and
service-role keys must only be used server-side, must never be imported into
client components, and must never be committed to the repository.

Auth-aware navigation uses the server-side Supabase session. Local builds
fallback to logged-out navigation when Supabase env vars are absent, but Netlify
deployments need the Supabase variables above to show real logged-in dashboard,
account, and sign-out actions.

## Phase 3 Testing Checklist

Use this checklist before merging or promoting Phase 3:

```bash
npm ci
npm run build
npm run lint
npx tsc --noEmit
```

Auth-specific checks:

1. Local auth registration, login, logout, password reset, and account/dashboard access.
2. Profile and free subscription bootstrap after signup/login.
3. Anonymous protected route redirects for `/dashboard` and `/account`.
4. Deploy-preview public route checks and protected route redirects.
5. Deploy-preview registration/login/logout/password reset after Netlify Supabase env vars are configured.
6. Development-only authenticated RLS tests with `npm run test:rls:auth`.

Latest known Phase 3+4 deploy-preview result:

- Preview URL: `https://deploy-preview-5--trading-research-portal.netlify.app`
- Public routes: passing.
- Protected redirects: passing.
- CSS/JS assets: passing.
- Authenticated deploy-preview content access was verified for development free, premium, and pro users with temporary QA accounts that were removed after testing.

## Phase 4 Content System

Phase 4 adds Supabase-backed public and member content surfaces while keeping payments, admin CRUD, TradingView embeds, and email notifications out of scope.

Content routes:

- `/ideas`: searchable/filterable trading idea previews.
- `/ideas/[slug]`: full trading idea details when RLS allows access; locked preview otherwise.
- `/research`: searchable/filterable research post previews.
- `/research/[slug]`: full research post details when RLS allows access; locked preview otherwise.
- `/dashboard`: authenticated dashboard shell with latest trading ideas, recently updated ideas, latest research, and account tier summary widgets.

Access model:

- Anonymous visitors can read full free content and see locked premium/pro previews.
- Free users can read full free content, see locked premium/pro previews, and access the dashboard.
- Premium users can read full free and premium content, with pro content locked.
- Pro users can read full free, premium, and pro content.
- Admin users can read all content and access the Phase 5 admin dashboard for content management.

Security model:

- Full content is fetched with the normal server Supabase client and enforced by database RLS.
- Preview RPC functions return safe preview fields only.
- The admin client must not be used to display premium/pro content to unauthorized users.
- Full premium/pro thesis, body content, entry zones, invalidation levels, targets, updates, and chart details must not be exposed in metadata, page HTML, or serialized client props for unauthorized users.
- Locked pages show only safe preview fields and member-access copy.

Content management note:

- Content can be managed through the Phase 5 admin dashboard.
- Admin-created content should continue to be tested on public pages before production promotion, especially after publish/unpublish/delete actions.

Phase 4 deploy-preview QA:

- Preview URL: `https://deploy-preview-5--trading-research-portal.netlify.app`
- Public routes: passing.
- Content list/detail routes: passing.
- Anonymous locked-content checks: passing.
- Authenticated free/premium/pro access checks: passing.
- Local `npm run build`, `npm run lint`, and `npx tsc --noEmit`: passing.

## Phase 5 Admin Dashboard

Phase 5 adds a protected admin dashboard for content management. It does not add Stripe, payments, broker integrations, order execution, or email notification backend logic.

Admin routes:

- `/admin`: admin overview with content stats, quick actions, recent content, and operational notes.
- `/admin/ideas`: browse, search, filter, publish, unpublish, and delete trading ideas.
- `/admin/ideas/new`: create a trading idea.
- `/admin/ideas/[id]/edit`: edit trading idea content, safe preview copy, publishing state, and tags.
- `/admin/ideas/[id]/updates`: manage idea update-log entries.
- `/admin/ideas/[id]/charts`: manage chart metadata with Phase 6 TradingView preview support.
- `/admin/posts`: browse, search, filter, publish, unpublish, and delete research posts.
- `/admin/posts/new`: create a research post.
- `/admin/posts/[id]/edit`: edit research post content, safe excerpt copy, and publishing state.
- `/admin/tags`: create, edit, and delete tags when safe.

Admin capabilities:

- Create, edit, publish, unpublish, and delete trading ideas.
- Manage idea updates.
- Manage chart metadata for future chart integration.
- Create, edit, publish, unpublish, and delete research posts.
- Create, edit, and delete tags.
- Assign tags to trading ideas.

Phase 5 security model:

- `/admin` routes require an authenticated user with `profiles.role = 'admin'`.
- Admin layouts and pages call `requireAdmin()`.
- Admin server actions call `requireAdmin()` before mutations.
- Routine admin CRUD uses the normal server Supabase client so admin RLS policies are exercised.
- RLS continues to protect database writes.
- The service-role/admin Supabase client must remain server-only and should not be used for routine admin CRUD.
- Hidden form fields must never be trusted for role, tier, or user authorization.

Phase 5 content safety:

- Premium/pro public previews must not leak full thesis, body, exact entries, invalidation, targets, or proprietary setup details.
- Locked content must remain protected by RLS and server-side access checks.
- Admin-created content should be tested on the public `/ideas`, `/ideas/[slug]`, `/research`, and `/research/[slug]` pages after publish/unpublish/delete actions.

Phase 5 deploy-preview QA:

- Preview URL: `https://deploy-preview-6--trading-research-portal.netlify.app`
- Netlify deploy state: ready.
- Public routes: passing.
- Anonymous protected redirects for `/dashboard`, `/account`, and `/admin`: passing.
- Anonymous locked-content public regression: passing.
- Non-admin admin-route protection and RLS mutation blocking: passing.
- Admin route access: passing.
- Admin CRUD for ideas, posts, idea updates, chart metadata, tags, and tag assignment: passing.
- Admin-created content public regression: passing.
- Premium/pro locked-content leak checks: passing.
- Supabase server key was rotated after exposure; post-rotation deploy/admin smoke testing passed.
- Temporary QA records and users were removed after testing.
- CSS assets: passing.
- Local `npm run build`, `npm run lint`, and `npx tsc --noEmit`: passing.
- Phase 5 is merge-ready.

## Phase 6 - Chart Integration

Phase 6 integrates chart display from the existing `idea_charts` metadata model.
It does not add broker connections, order execution, copy trading, payments,
email notifications, or live market data licensing features.

Chart integration rules:

- TradingView widgets are used for visual chart display only.
- Chart metadata is stored in the `idea_charts` table.
- Full chart widgets should only render on full-access idea pages.
- Locked premium/pro ideas should not expose private chart metadata when that
  metadata is treated as part of the premium research.
- Arbitrary embed HTML from the database is never rendered; chart URLs and
  symbols must pass server-side validation before display.
- No broker connection exists.
- No order execution exists.
- No copy trading exists.
- No guarantee is made about real-time exchange data.
- Real-time data licensing is not handled by this app.
- TradingView widget availability depends on TradingView-supported symbols and
  markets.

Accepted chart types:

- `tradingview_embed`
- `image`
- `lightweight_chart`

Phase 6 implementation focus:

- Implement `tradingview_embed` rendering from approved chart metadata.
- Keep `image` and `lightweight_chart` as fallback or placeholder modes unless
  they are explicitly implemented in a later prompt.
- Lightweight Charts may be considered later for custom static chart snapshots.
- Real market data licensing and any curated data pipeline must be handled
  separately before custom chart rendering is implemented.
- Preserve existing RLS and locked-content behavior when adding chart rendering.

Phase 6 QA status:

- Anonymous deploy-preview chart access passed.
- Authenticated free, premium, pro, and admin chart access passed.
- Locked premium/pro pages did not expose private chart metadata, thesis, body, or levels.
- Admin chart metadata create, edit, validation, delete, and cleanup passed.
- Mobile chart layout, duplicate iframe checks, and console checks passed.
- Supabase deploy-preview email/magic-link redirect settings should still be verified before production auth email QA.

## Phase 7 Idea Lifecycle and Update Refinement

Phase 7 adds structured research lifecycle tracking for trading ideas. It does
not add broker integrations, order execution, copy trading, payment logic, or
email notification backend behavior.

Lifecycle model:

- Idea statuses can move through research review states such as watching, active, triggered, target hit, invalidated, and closed.
- Structured outcome labels support educational review states such as pending, no trade, invalidated, stopped out, target hit, win, loss, breakeven, and manually closed.
- Lifecycle events are stored on `idea_updates` with event type, previous status, resulting status, optional outcome, event timestamp, and major-update flag.
- Closed ideas can store `outcome_summary`, `lessons_learned`, `review_published`, and `review_published_at`.
- `user_activity_state` stores per-user seen timestamps for dashboard/content/lifecycle recency features.

Admin lifecycle features:

- `/admin/ideas/[id]/edit` includes a lifecycle panel with status, outcome, lifecycle timestamps, and review publication state.
- Admins can activate ideas, mark ideas triggered, mark target 1/2/3 hit, invalidate, close with review, reopen, and publish or unpublish reviews.
- `/admin/ideas/[id]/updates` shows lifecycle event metadata, status before/after, outcome after, event timestamp, major-update state, and manual note creation.
- Admin lifecycle actions call `requireAdmin()` and use the normal server Supabase client so admin RLS policies remain exercised.

Public and member behavior:

- Full-access `/ideas/[slug]` pages show a lifecycle summary, research timeline, event badges, major update indicators, and published outcome review when available.
- Locked premium/pro idea pages expose only safe preview fields and do not show private update bodies, outcome summaries, lessons learned, chart details, thesis, entries, invalidation, or targets.
- `/ideas` supports lifecycle-aware filtering and sorting by status, outcome, recently updated, closed reviews, recently updated ideas, last lifecycle event, and closed recently.
- `/dashboard` includes lifecycle-aware widgets for new since last visit, recently updated ideas, active/triggered ideas, closed reviews, and invalidated ideas.
- Authenticated users can mark lifecycle dashboard recency as seen without tracking broker/order behavior.

Security and compliance:

- Lifecycle updates are educational research notes and are not trade instructions.
- Outcome labels are educational review categories and are not performance guarantees.
- No broker connection exists.
- No order execution exists.
- No copy trading exists.
- No email notification backend is active yet.
- Premium/pro lifecycle details remain protected by Supabase RLS and server-side access checks.

Phase 7 deploy-preview QA:

- Preview URL: `https://deploy-preview-8--trading-research-portal.netlify.app`
- Public routes and protected redirects: passing.
- Anonymous free lifecycle timeline and locked premium/pro lifecycle checks: passing.
- Authenticated free, premium, pro, and admin lifecycle access checks: passing.
- Admin lifecycle transition QA, close-with-review, reopen, and cleanup: passing.
- Dashboard lifecycle widget and mark-seen UI checks: passing.
- Locked-content leak checks for update bodies, outcome reviews, thesis, levels, and private chart metadata: passing.
- TradingView regression, CSS asset, duplicate iframe, console, and narrow-viewport checks: passing.
- Local `npm run build`, `npm run lint`, and `npx tsc --noEmit`: passing.

## Phase 8 Advanced Member Dashboard and Software Library

Phase 8 adds authenticated member personalization and a tier-gated software
library. It does not add Stripe, payment logic, email notification backend
logic, broker integrations, order execution, copy trading, live market data
feeds, performance reporting, or automatic TradingView invite automation.

Member dashboard features:

- Saved ideas with optional member notes.
- Followed tickers with optional notes and related idea previews.
- Advanced watchlist workflows using user-owned `watchlist_items`.
- Dashboard preferences for default view, sort order, locked previews, charts,
  closed reviews, software visibility, preferred asset classes, statuses, and
  visibility filters.
- Recent lifecycle activity feed with mark-seen behavior.
- Closed reviews dashboard with access-aware review display.
- Member-owned idea notes foundation.
- Dashboard widgets for saved ideas, followed tickers, watchlist, new updates,
  closed reviews, and software availability.

Member routes:

- `/dashboard`
- `/dashboard/watchlist`
- `/dashboard/saved`
- `/dashboard/following`
- `/dashboard/recent`
- `/dashboard/closed`
- `/dashboard/software`
- `/dashboard/software/[slug]`
- `/dashboard/preferences`

Software library features:

- Free users have no software access.
- Premium users can access Lite software through `premium_lite` products.
- Pro users can access Lite and Pro software.
- Admin users can manage all software products and requests.
- TradingView invite-only access is a manual/admin-managed workflow in Phase 8.
- The portal does not automatically grant TradingView permissions.
- Private Pine Script source code is not stored by default and must not be
  exposed to unauthorized users.
- Software pages render descriptions, documentation, release notes, setup
  instructions, safe links, and access request status only.

Admin software routes:

- `/admin/software`
- `/admin/software/new`
- `/admin/software/[id]/edit`
- `/admin/software/requests`

Phase 8 security model:

- Dashboard routes require an authenticated user.
- User-owned member records are protected by RLS and are not visible to other
  users.
- Member server actions never accept arbitrary `user_id` values from forms.
- Software access is tier-gated by RLS and server-side access checks.
- Free users cannot access Lite or Pro software details.
- Premium users cannot access Pro software details.
- Full premium/pro content remains protected on idea, dashboard, and software
  surfaces.
- No payments were added in Phase 8.
- No automatic TradingView invite automation was added.
- No email notification backend was added.
- No broker integration, order execution, or copy trading was added.
- At Phase 8 completion, subscription tiers were still manually managed until
  the future Stripe phase.

Phase 8 deploy-preview QA:

- Preview URL: `https://deploy-preview-9--trading-research-portal.netlify.app`
- Anonymous public route checks: passing.
- Anonymous protected dashboard/admin route redirects: passing.
- Anonymous content and locked premium/pro leak checks: passing.
- Free SPY chart regression: passing.
- Free member dashboard workflows, software lockout, and locked premium/pro content checks: passing.
- Premium member dashboard workflows, Lite software access, Pro software lockout, and software request flow: passing.
- Pro member dashboard workflows, Lite + Pro software access, and software request flow: passing.
- Admin software management, software access request management, and admin-route access checks: passing.
- User-owned data isolation, premium/pro dashboard leak checks, software leak checks, mobile dashboard/software QA, and temporary QA cleanup: passing.
- Local `npm run build`, `npm run lint`, and `npx tsc --noEmit`: passing.

## Phase 9 Stripe Subscriptions

Phase 9 adds Stripe-hosted subscription billing and webhook-driven tier
automation. It does not add email notification backend behavior, broker
integrations, order execution, copy trading, automatic TradingView invite
automation, or performance reporting.

Phase 9 billing implementation:

- Stripe Checkout subscription flow from `/pricing`.
- Stripe Customer Portal access from `/account/billing`.
- Stripe webhook route at `/api/stripe/webhook`.
- Server-only Stripe client and billing configuration helpers.
- Stripe customer mapping, checkout session tracking, webhook event storage,
  and subscription audit records.
- Subscription table sync from verified Stripe webhook events.
- Premium and Pro tier automation based on Stripe price IDs.
- Account billing page with current tier, billing status, active/inactive
  access state, current period end, and Customer Portal entry point.
- Dashboard and software library access messaging tied to effective subscription
  access.

Phase 9 routes and actions:

- `/pricing` uses `createCheckoutSessionAction` for Premium/Pro monthly and
  annual checkout.
- `/account/billing` shows subscription status and uses
  `createCustomerPortalSessionAction` for Stripe Customer Portal sessions.
- `/api/stripe/webhook` verifies Stripe webhook signatures, stores events, and
  syncs subscriptions.
- `/dashboard` and `/dashboard/software` show billing-aware access widgets and
  software access messaging.

Phase 9 access model:

- Inactive or missing subscription: effective tier is free.
- Active or trialing Premium: premium content and Lite software access.
- Active or trialing Pro: premium/pro content and Lite + Pro software access.
- Canceled, past due, unpaid, incomplete, and incomplete-expired statuses do
  not grant paid access unless a future grace policy is explicitly added.
- Admin management access remains role-based through `profiles.role = 'admin'`
  and is independent of subscription tier.

Phase 9 security model:

- Frontend actions can start Stripe-hosted Checkout or Customer Portal flows,
  but cannot update `subscriptions.tier` or `subscriptions.status`.
- Verified Stripe webhooks are the source of truth for paid access changes.
- Webhook signatures are verified with `STRIPE_WEBHOOK_SECRET`.
- Webhook idempotency is implemented with `stripe_webhook_events`.
- Subscription audit history is recorded in `subscription_events`.
- Stripe and Supabase secret keys are server-only and must never be imported
  into client components.
- Real Stripe keys, webhook secrets, Supabase secrets, and database passwords
  must never be committed.

Phase 9 deploy-preview QA status:

- PR deploy preview: `https://deploy-preview-11--trading-research-portal.netlify.app`
- Public hosted routes and anonymous protected redirects: passing.
- `/api/stripe/webhook` rejects missing or invalid signatures with `400`.
- Public HTML secret-pattern checks: passing.
- Local `npm run build`, `npm run lint`, and `npx tsc --noEmit`: passing.
- Phase 9 migrations are applied in the linked Supabase prelaunch project, and
  generated database types include the Stripe billing tables/fields.
- Hosted Premium monthly, Premium annual, Pro monthly, and Pro annual Checkout
  flows passed in Stripe test mode.
- Hosted Customer Portal session creation and cancellation downgrade passed.
- Hosted webhook sync and duplicate replay/idempotency passed.
- Payment-failure/past-due handling passed through signed hosted webhook QA:
  `invoice.payment_failed` is stored/processed, and `past_due` subscription
  status removes paid access.
- Unknown-price no-grant behavior passed.
- Access automation passed: active Premium unlocks premium content and Lite
  software; active Pro unlocks premium/pro content and Lite + Pro software;
  canceled and past-due states remove paid access.
- Frontend actions were verified not to grant tier/status directly; access
  changes only after webhook sync.

## Security Notes

- Never commit `.env`, `.env.local`, `.env.development`, or `.env.production`.
- Never commit Supabase secret keys, service-role keys, database passwords, or access tokens.
- `SUPABASE_SECRET_KEY` and legacy `SUPABASE_SERVICE_ROLE_KEY` are server-only and must never be imported into client components.
- The admin Supabase client bypasses RLS and is only for secure server-side repair/bootstrap tasks.
- Routine admin CRUD should use the normal server Supabase client and database RLS.
- Dashboard member data remains user-owned and RLS-protected.
- Software access remains tier-gated and manual for TradingView invite-only delivery.
- Stripe subscription logic is limited to Phase 9 Checkout, Customer Portal, and
  verified webhook-driven subscription sync. Frontend actions must not directly
  grant paid access.
- Broker integration, order execution, copy trading, automatic TradingView
  invite automation, and email notification backend logic remain out of scope.
- New users remain free unless verified Stripe webhook sync updates their
  subscription state.

## Next Phase

Recommended next phase after Phase 9 QA/merge: Phase 10 - Email Notifications.

Phase 10 should add opt-in email notification workflows after Stripe billing is
verified and production-ready. It should not add broker integrations, order
execution, copy trading, or automatic TradingView invite automation.

Future planned phases:

- Phase 10: Email notifications.
