# Trading Research Portal

A professional public marketing website for a future trading research portal. The Phase 1 site is built with Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.

Phase 1 is static only. It does not include Supabase, Stripe, authentication, database logic, API routes, TradingView charts, email delivery, or member-gated content.

## Phase 1 Status

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

All content is placeholder marketing content for educational market research. Premium features are described as planned future functionality only.

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

Current routing note: `netlify.toml` includes explicit redirects for the static
Phase 1 pages so the manual Netlify deploy can serve the generated Next output.
Treat those redirects as temporary for the public marketing phase and revisit
them before adding SSR, authentication, protected routes, API routes, or
server-side integrations.

## Environment Variables

No environment variables are required for Phase 1 to build.

Future integrations may use the placeholders in `.env.example`:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Do not commit real secrets. Production secrets should be configured in the Netlify UI.

## Phase 2 Plan

Phase 2 will prepare the data foundation. Planned work:

- Supabase database schema
- Content models for market notes, chart breakdowns, watchlists, trading ideas, update logs, and reviews
- Row Level Security planning for public, member, and future admin access patterns

Phase 2 should still avoid Stripe billing and real authentication wiring unless those are explicitly moved forward in the project plan.
