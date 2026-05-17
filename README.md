# Trading Research Portal

A professional trading research portal built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Netlify, and Supabase.

The public site is live as a marketing experience. Supabase schema, RLS, seed data, typed client utilities, and Phase 3 authentication are in place for development. Stripe, paid-tier upgrades, admin CRUD, TradingView charts, and email notification backend work are intentionally out of scope for the current build.

## Phase Status

- Phase 0: Complete. Project foundation, Netlify configuration, dark financial design system, and deployment baseline are in place.
- Phase 1: Complete. Public marketing routes, early-access copy, legal/support pages, metadata, and responsive polish are in place.
- Phase 2: Complete. Supabase packages, CLI structure, migrations, RLS policies, seed data, environment structure, client utility scaffolding, remote migration verification, and generated database types are in place.
- Phase 2.5: Complete. Supabase schema/RLS verification passed, including anonymous read/write smoke tests and authenticated RLS validation for free, premium, pro, and admin access.
- Phase 3: Complete. Supabase Auth, SSR cookie sessions, protected routes, auth callback, password reset, and account/dashboard shells are implemented and verified.
- Phase 4: Complete. Supabase-backed free, premium, and pro content previews, detail pages, access-aware rendering, dashboard content widgets, and deploy-preview access-control QA are in place.

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

All public content is early-access marketing content for educational market research. Premium features are described as planned future functionality only.

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

## Supabase Local Development

Phase 2 uses Supabase CLI project files and migrations for local schema work.
The application does not connect public routes to Supabase yet.

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
3. Add the current Netlify deploy-preview callback URL when testing hosted auth, for example `https://deploy-preview-4--trading-research-portal.netlify.app/auth/callback`.
4. Add a Netlify deploy-preview redirect pattern if supported by the Supabase project settings: `https://*.netlify.app/auth/callback`.
5. Add the Phase 4 deploy-preview redirect URL while PR #5 is under review: `https://deploy-preview-5--trading-research-portal.netlify.app/auth/callback`.
6. Add the production Netlify redirect URL before merging to production: `https://trading-research-portal.netlify.app/auth/callback`.
7. Add the custom-domain production redirect URL once a custom domain is available: `https://YOUR_DOMAIN.com/auth/callback`.

Netlify environment variable checklist:

```bash
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

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
- Admin users can read all content. Admin CRUD is intentionally not implemented yet.

Security model:

- Full content is fetched with the normal server Supabase client and enforced by database RLS.
- Preview RPC functions return safe preview fields only.
- The admin client must not be used to display premium/pro content to unauthorized users.
- Full premium/pro thesis, body content, entry zones, invalidation levels, targets, updates, and chart details must not be exposed in metadata, page HTML, or serialized client props for unauthorized users.
- Locked pages show only safe preview fields and member-access copy.

Content management note:

- Content is currently seed/database-driven.
- Admin publishing, editing, review, and archive workflows come in a later phase.

Phase 4 deploy-preview QA:

- Preview URL: `https://deploy-preview-5--trading-research-portal.netlify.app`
- Public routes: passing.
- Content list/detail routes: passing.
- Anonymous locked-content checks: passing.
- Authenticated free/premium/pro access checks: passing.
- Local `npm run build`, `npm run lint`, and `npx tsc --noEmit`: passing.

## Security Notes

- Never commit `.env`, `.env.local`, `.env.development`, or `.env.production`.
- Never commit Supabase secret keys, service-role keys, database passwords, or access tokens.
- `SUPABASE_SECRET_KEY` and legacy `SUPABASE_SERVICE_ROLE_KEY` are server-only and must never be imported into client components.
- The admin Supabase client bypasses RLS and is only for secure server-side repair/bootstrap tasks.
- No Stripe, payment, billing portal, premium upgrade, admin CRUD, TradingView chart, or email notification backend logic exists yet.
- New users remain free unless later subscription logic updates them.

## Next Phase

Recommended next phase: Phase 5 - Admin Dashboard for Content Management.

Phase 5 should focus on secure admin-only content management for ideas, research posts, updates, tags, and publishing workflow. Continue to avoid Stripe payments, billing portal behavior, TradingView integration, and email notification backend work until their planned phases.

Future planned phases:

- Phase 6: TradingView chart integration.
- Phase 7: Idea update lifecycle refinement.
- Phase 8: Advanced member dashboard.
- Phase 9: Stripe subscriptions.
- Phase 10: Email notifications.
