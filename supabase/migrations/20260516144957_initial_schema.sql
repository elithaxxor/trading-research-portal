-- Trading Research Portal initial schema.
-- This schema prepares trading research content, subscriptions metadata,
-- watchlists, notifications, and user profiles.
--
-- Auth UI, protected routes, Stripe integration, and app data fetching are not
-- implemented in this phase. Row Level Security policies are intentionally
-- deferred to the next migration/prompt.

create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'admin');
create type public.subscription_tier as enum ('free', 'premium', 'pro');
create type public.subscription_status as enum (
  'none',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired'
);
create type public.content_visibility as enum ('free', 'premium', 'pro');
create type public.asset_class as enum (
  'stock',
  'etf',
  'option',
  'crypto',
  'forex',
  'futures',
  'index',
  'macro',
  'other'
);
create type public.idea_bias as enum ('long', 'short', 'neutral', 'watch');
create type public.idea_status as enum (
  'watching',
  'active',
  'triggered',
  'invalidated',
  'target_hit',
  'closed'
);
create type public.risk_level as enum ('low', 'medium', 'high');
create type public.chart_type as enum (
  'tradingview_embed',
  'image',
  'lightweight_chart'
);
create type public.notification_type as enum (
  'new_idea',
  'idea_update',
  'new_post',
  'weekly_digest'
);
create type public.notification_status as enum ('pending', 'sent', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status public.subscription_status not null default 'none',
  tier public.subscription_tier not null default 'free',
  price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.trading_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  ticker text not null,
  asset_class public.asset_class not null default 'stock',
  bias public.idea_bias not null default 'watch',
  status public.idea_status not null default 'watching',
  visibility public.content_visibility not null default 'free',
  timeframe text,
  setup_type text,
  entry_zone text,
  invalidation_level text,
  target_1 text,
  target_2 text,
  target_3 text,
  risk_level public.risk_level not null default 'medium',
  summary text,
  thesis text,
  position_disclosure text,
  risk_disclosure text,
  educational_purpose_only boolean not null default true,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_updates (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.trading_ideas(id) on delete cascade,
  title text not null,
  body text,
  status_after_update public.idea_status,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.idea_charts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.trading_ideas(id) on delete cascade,
  chart_type public.chart_type not null default 'tradingview_embed',
  symbol text,
  tradingview_symbol text,
  interval text,
  embed_url text,
  image_url text,
  caption text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  visibility public.content_visibility not null default 'free',
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.idea_tags (
  idea_id uuid not null references public.trading_ideas(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (idea_id, tag_id)
);

create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references public.trading_ideas(id) on delete set null,
  ticker text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create table public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  notification_type public.notification_type not null,
  status public.notification_status not null default 'pending',
  subject text,
  content_type text,
  content_id uuid,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index trading_ideas_slug_idx on public.trading_ideas (slug);
create index trading_ideas_ticker_idx on public.trading_ideas (ticker);
create index trading_ideas_status_idx on public.trading_ideas (status);
create index trading_ideas_visibility_idx on public.trading_ideas (visibility);
create index trading_ideas_published_published_at_idx
  on public.trading_ideas (published, published_at desc);

create index posts_slug_idx on public.posts (slug);
create index posts_visibility_idx on public.posts (visibility);
create index posts_published_published_at_idx
  on public.posts (published, published_at desc);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);
create index subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);

create index idea_updates_idea_id_created_at_idx
  on public.idea_updates (idea_id, created_at desc);
create index idea_charts_idea_id_idx on public.idea_charts (idea_id);
create index watchlist_items_user_id_idx on public.watchlist_items (user_id);
create index email_notifications_user_id_created_at_idx
  on public.email_notifications (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger set_trading_ideas_updated_at
before update on public.trading_ideas
for each row execute function public.set_updated_at();

create trigger set_idea_charts_updated_at
before update on public.idea_charts
for each row execute function public.set_updated_at();

create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger set_watchlist_items_updated_at
before update on public.watchlist_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
