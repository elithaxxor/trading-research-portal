-- Phase 9 Stripe billing support.
-- Stripe webhooks are the source of truth for paid subscription tiers.
-- Frontend actions may start Stripe-hosted Checkout or Customer Portal flows,
-- but they must never update subscription tier/status directly.

alter table public.subscriptions
  add column if not exists stripe_product_id text,
  add column if not exists stripe_latest_invoice_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists last_webhook_event_id text,
  add column if not exists last_synced_at timestamptz;

create table if not exists public.stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  mode text not null default 'subscription',
  requested_tier public.subscription_tier not null,
  requested_price_id text not null,
  status text,
  payment_status text,
  success_url text,
  cancel_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  api_version text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received',
  error text,
  payload jsonb
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_event_id text references public.stripe_webhook_events(stripe_event_id) on delete set null,
  event_type text not null,
  previous_tier public.subscription_tier,
  new_tier public.subscription_tier,
  previous_status public.subscription_status,
  new_status public.subscription_status,
  price_id text,
  note text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_subscriptions_updated_at'
      and tgrelid = 'public.subscriptions'::regclass
  ) then
    execute 'create trigger set_subscriptions_updated_at
      before update on public.subscriptions
      for each row execute function public.set_updated_at()';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_stripe_customers_updated_at'
      and tgrelid = 'public.stripe_customers'::regclass
  ) then
    execute 'create trigger set_stripe_customers_updated_at
      before update on public.stripe_customers
      for each row execute function public.set_updated_at()';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_stripe_checkout_sessions_updated_at'
      and tgrelid = 'public.stripe_checkout_sessions'::regclass
  ) then
    execute 'create trigger set_stripe_checkout_sessions_updated_at
      before update on public.stripe_checkout_sessions
      for each row execute function public.set_updated_at()';
  end if;
end;
$$;

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions(stripe_subscription_id);
create index if not exists subscriptions_tier_status_idx
  on public.subscriptions(tier, status);

create index if not exists stripe_customers_stripe_customer_id_idx
  on public.stripe_customers(stripe_customer_id);
create index if not exists stripe_checkout_sessions_user_created_at_idx
  on public.stripe_checkout_sessions(user_id, created_at desc);
create index if not exists stripe_checkout_sessions_stripe_session_id_idx
  on public.stripe_checkout_sessions(stripe_session_id);
create index if not exists stripe_webhook_events_event_type_received_at_idx
  on public.stripe_webhook_events(event_type, received_at desc);
create index if not exists stripe_webhook_events_processing_status_idx
  on public.stripe_webhook_events(processing_status);
create index if not exists subscription_events_user_created_at_idx
  on public.subscription_events(user_id, created_at desc);
create index if not exists subscription_events_stripe_subscription_id_idx
  on public.subscription_events(stripe_subscription_id);

alter table public.stripe_customers enable row level security;
alter table public.stripe_checkout_sessions enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "Users can select their own Stripe customer row" on public.stripe_customers;
create policy "Users can select their own Stripe customer row"
  on public.stripe_customers for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all Stripe customer rows" on public.stripe_customers;
create policy "Admins can select all Stripe customer rows"
  on public.stripe_customers for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can select their own Stripe checkout sessions" on public.stripe_checkout_sessions;
create policy "Users can select their own Stripe checkout sessions"
  on public.stripe_checkout_sessions for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all Stripe checkout sessions" on public.stripe_checkout_sessions;
create policy "Admins can select all Stripe checkout sessions"
  on public.stripe_checkout_sessions for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can select all Stripe webhook events" on public.stripe_webhook_events;
create policy "Admins can select all Stripe webhook events"
  on public.stripe_webhook_events for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can select their own subscription events" on public.subscription_events;
create policy "Users can select their own subscription events"
  on public.subscription_events for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all subscription events" on public.subscription_events;
create policy "Admins can select all subscription events"
  on public.subscription_events for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.stripe_customers from anon, authenticated;
revoke all on public.stripe_checkout_sessions from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;
revoke all on public.subscription_events from anon, authenticated;

grant select on public.stripe_customers to authenticated;
grant select on public.stripe_checkout_sessions to authenticated;
grant select on public.stripe_webhook_events to authenticated;
grant select on public.subscription_events to authenticated;

comment on table public.stripe_customers is
  'Maps Supabase users to Stripe customers. Stripe webhooks are the source of truth for paid subscription state.';
comment on table public.stripe_checkout_sessions is
  'Tracks server-created Stripe-hosted Checkout Sessions for audit and support. Frontend clicks do not update subscription tier/status.';
comment on table public.stripe_webhook_events is
  'Stores Stripe webhook event IDs, processing state, and payloads for idempotency and audit.';
comment on table public.subscription_events is
  'Append-only audit history for Stripe-driven subscription tier/status changes.';

comment on column public.subscriptions.stripe_product_id is
  'Stripe product associated with the latest synced subscription item, if available.';
comment on column public.subscriptions.last_webhook_event_id is
  'Latest verified Stripe webhook event that synced this subscription row.';
comment on column public.subscriptions.last_synced_at is
  'Timestamp when Stripe subscription state was last synced by trusted server webhook code.';
comment on column public.stripe_checkout_sessions.requested_tier is
  'Requested plan tier for Stripe-hosted Checkout. This is audit metadata only and is not trusted for access until a verified webhook updates subscriptions.';
comment on column public.stripe_checkout_sessions.requested_price_id is
  'Stripe Price ID requested by server-side Checkout creation. Price IDs are configured per environment.';
comment on column public.stripe_webhook_events.processing_status is
  'Webhook processing state for idempotency. Expected values are managed by server code, not client components.';
comment on column public.subscription_events.note is
  'Audit note for subscription lifecycle changes. Software access continues to use subscription tier/status through RLS and server checks.';
