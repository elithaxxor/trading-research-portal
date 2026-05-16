# Trading Research Portal

A professional trading research portal built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Netlify, and Supabase schema preparation.

The public site is live as a static marketing experience. Supabase schema, RLS, seed data, and typed client utilities have been prepared for future backend phases, but public pages are not connected to Supabase yet.

## Phase Status

- Phase 0: Complete. Project foundation, Netlify configuration, dark financial design system, and deployment baseline are in place.
- Phase 1: Complete / cleanup-ready. Public marketing routes and early-access copy are in place.
- Phase 2: Complete. Supabase packages, CLI structure, migrations, RLS policies, seed data, env structure, client utility scaffolding, remote migration verification, and generated database types are in place.

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
- Static login and registration placeholders

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

No environment variables are required for the current public site to build.

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

Auth UI, protected routes, middleware session refresh, and dashboard data fetching
begin in Phase 3. Payment and billing features come later.

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

## Phase 3 Auth Setup

Before implementing Supabase Auth, create a local `.env.local` file with real
development project values. Do not commit this file.

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
3. Add a Netlify deploy-preview redirect pattern if needed: `https://*.netlify.app/auth/callback`.
4. Add the production redirect URL once a custom domain is available: `https://YOUR_DOMAIN.com/auth/callback`.

Netlify environment variable checklist:

```bash
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

Public `NEXT_PUBLIC_*` values may be used by browser clients. Secret and
service-role keys must only be used server-side, must never be imported into
client components, and must never be committed to the repository.

Auth-aware navigation uses the server-side Supabase session. Local builds
fallback to logged-out navigation when Supabase env vars are absent, but Netlify
deployments need the Supabase variables above to show real logged-in dashboard,
account, and sign-out actions.

Before merging Phase 3:

1. Add Supabase SSR auth middleware/proxy carefully and test cookie refresh behavior.
2. Verify protected routing and auth flows on a Netlify deploy preview.
3. Re-run authenticated RLS checks for free, premium, pro, and admin users.
4. Do not add Stripe billing, API routes, admin mutations, or TradingView charts until their planned phases.
