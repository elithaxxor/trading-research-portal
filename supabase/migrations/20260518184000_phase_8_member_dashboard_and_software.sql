-- Phase 8: Advanced member dashboard and gated software library.
-- These structures support member-owned dashboard data and tier-gated software access.
-- They do not add payments, broker integrations, order execution, copy trading, email notifications,
-- automatic TradingView invite automation, or performance reporting.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_dashboard_view') then
    create type public.member_dashboard_view as enum (
      'overview',
      'watchlist',
      'saved',
      'following',
      'recent',
      'closed',
      'software'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_sort_preference') then
    create type public.member_sort_preference as enum (
      'recently_updated',
      'newest_published',
      'lifecycle_recent',
      'status',
      'ticker'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'software_access_tier') then
    create type public.software_access_tier as enum (
      'premium_lite',
      'pro'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'software_type') then
    create type public.software_type as enum (
      'pinescript',
      'indicator',
      'strategy',
      'template',
      'tool',
      'guide',
      'other'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'software_delivery_type') then
    create type public.software_delivery_type as enum (
      'tradingview_invite_only',
      'protected_download',
      'documentation_only',
      'external_link',
      'manual_access'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'software_access_request_status') then
    create type public.software_access_request_status as enum (
      'requested',
      'approved',
      'rejected',
      'granted',
      'revoked',
      'needs_info'
    );
  end if;
end $$;

create or replace function public.can_access_software(required_tier public.software_access_tier)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  user_tier public.subscription_tier;
begin
  if auth.uid() is null then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  user_tier := public.get_user_tier();

  if required_tier = 'premium_lite' then
    return user_tier in ('premium', 'pro');
  end if;

  if required_tier = 'pro' then
    return user_tier = 'pro';
  end if;

  return false;
end;
$$;

revoke all on function public.can_access_software(public.software_access_tier) from public;
grant execute on function public.can_access_software(public.software_access_tier) to authenticated;

create table if not exists public.saved_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid not null references public.trading_ideas(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idea_id)
);

create table if not exists public.followed_tickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null check (btrim(ticker) <> ''),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create table if not exists public.member_dashboard_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_view public.member_dashboard_view not null default 'overview',
  default_sort public.member_sort_preference not null default 'recently_updated',
  show_locked_previews boolean not null default true,
  show_charts_on_dashboard boolean not null default true,
  show_closed_reviews boolean not null default true,
  show_software_section boolean not null default true,
  preferred_asset_classes public.asset_class[] not null default '{}'::public.asset_class[],
  preferred_statuses public.idea_status[] not null default '{}'::public.idea_status[],
  preferred_visibility public.content_visibility[] not null default '{}'::public.content_visibility[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_idea_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid not null references public.trading_ideas(id) on delete cascade,
  note text not null check (btrim(note) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idea_id)
);

create table if not exists public.software_products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  slug text not null unique check (btrim(slug) <> ''),
  software_type public.software_type not null default 'pinescript',
  access_tier public.software_access_tier not null,
  delivery_type public.software_delivery_type not null default 'tradingview_invite_only',
  short_description text,
  full_description text,
  version text,
  release_notes text,
  tradingview_script_name text,
  tradingview_script_url text,
  external_url text,
  download_url text,
  documentation text,
  setup_instructions text,
  risk_disclosure text,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.software_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  software_product_id uuid not null references public.software_products(id) on delete cascade,
  tradingview_username text,
  status public.software_access_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text,
  user_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, software_product_id)
);

create or replace function public.enforce_software_access_request_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if auth.uid() is null or old.user_id <> auth.uid() then
    raise exception 'Only the request owner may update this software access request';
  end if;

  if old.status not in ('requested', 'needs_info') then
    raise exception 'This software access request is no longer editable';
  end if;

  if new.user_id <> old.user_id
    or new.software_product_id <> old.software_product_id
    or new.status <> old.status
    or new.requested_at <> old.requested_at
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
    or new.admin_note is distinct from old.admin_note
    or new.created_at <> old.created_at then
    raise exception 'Only request notes and TradingView username can be updated by the requester';
  end if;

  return new;
end;
$$;

drop trigger if exists set_saved_ideas_updated_at on public.saved_ideas;
create trigger set_saved_ideas_updated_at
  before update on public.saved_ideas
  for each row execute function public.set_updated_at();

drop trigger if exists set_followed_tickers_updated_at on public.followed_tickers;
create trigger set_followed_tickers_updated_at
  before update on public.followed_tickers
  for each row execute function public.set_updated_at();

drop trigger if exists set_member_dashboard_preferences_updated_at on public.member_dashboard_preferences;
create trigger set_member_dashboard_preferences_updated_at
  before update on public.member_dashboard_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists set_member_idea_notes_updated_at on public.member_idea_notes;
create trigger set_member_idea_notes_updated_at
  before update on public.member_idea_notes
  for each row execute function public.set_updated_at();

drop trigger if exists set_software_products_updated_at on public.software_products;
create trigger set_software_products_updated_at
  before update on public.software_products
  for each row execute function public.set_updated_at();

drop trigger if exists set_software_access_requests_updated_at on public.software_access_requests;
create trigger set_software_access_requests_updated_at
  before update on public.software_access_requests
  for each row execute function public.set_updated_at();

drop trigger if exists enforce_software_access_request_user_update on public.software_access_requests;
create trigger enforce_software_access_request_user_update
  before update on public.software_access_requests
  for each row execute function public.enforce_software_access_request_user_update();

create index if not exists saved_ideas_user_created_at_idx
  on public.saved_ideas(user_id, created_at desc);
create index if not exists saved_ideas_idea_id_idx
  on public.saved_ideas(idea_id);
create index if not exists followed_tickers_user_ticker_idx
  on public.followed_tickers(user_id, ticker);
create index if not exists member_idea_notes_user_idea_idx
  on public.member_idea_notes(user_id, idea_id);
create index if not exists member_dashboard_preferences_user_id_idx
  on public.member_dashboard_preferences(user_id);
create index if not exists software_products_slug_idx
  on public.software_products(slug);
create index if not exists software_products_access_tier_idx
  on public.software_products(access_tier);
create index if not exists software_products_published_published_at_idx
  on public.software_products(published, published_at desc);
create index if not exists software_access_requests_user_status_idx
  on public.software_access_requests(user_id, status);
create index if not exists software_access_requests_product_status_idx
  on public.software_access_requests(software_product_id, status);

alter table public.saved_ideas enable row level security;
alter table public.followed_tickers enable row level security;
alter table public.member_dashboard_preferences enable row level security;
alter table public.member_idea_notes enable row level security;
alter table public.software_products enable row level security;
alter table public.software_access_requests enable row level security;

drop policy if exists "Users can select their own saved ideas" on public.saved_ideas;
create policy "Users can select their own saved ideas"
  on public.saved_ideas for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all saved ideas" on public.saved_ideas;
create policy "Admins can select all saved ideas"
  on public.saved_ideas for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can insert their own saved ideas" on public.saved_ideas;
create policy "Users can insert their own saved ideas"
  on public.saved_ideas for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.trading_ideas ti
      where ti.id = saved_ideas.idea_id
    )
  );

drop policy if exists "Users can update their own saved ideas" on public.saved_ideas;
create policy "Users can update their own saved ideas"
  on public.saved_ideas for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own saved ideas" on public.saved_ideas;
create policy "Users can delete their own saved ideas"
  on public.saved_ideas for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can select their own followed tickers" on public.followed_tickers;
create policy "Users can select their own followed tickers"
  on public.followed_tickers for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all followed tickers" on public.followed_tickers;
create policy "Admins can select all followed tickers"
  on public.followed_tickers for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can insert their own followed tickers" on public.followed_tickers;
create policy "Users can insert their own followed tickers"
  on public.followed_tickers for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own followed tickers" on public.followed_tickers;
create policy "Users can update their own followed tickers"
  on public.followed_tickers for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own followed tickers" on public.followed_tickers;
create policy "Users can delete their own followed tickers"
  on public.followed_tickers for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can select their own dashboard preferences" on public.member_dashboard_preferences;
create policy "Users can select their own dashboard preferences"
  on public.member_dashboard_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all dashboard preferences" on public.member_dashboard_preferences;
create policy "Admins can select all dashboard preferences"
  on public.member_dashboard_preferences for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can insert their own dashboard preferences" on public.member_dashboard_preferences;
create policy "Users can insert their own dashboard preferences"
  on public.member_dashboard_preferences for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own dashboard preferences" on public.member_dashboard_preferences;
create policy "Users can update their own dashboard preferences"
  on public.member_dashboard_preferences for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can select their own idea notes" on public.member_idea_notes;
create policy "Users can select their own idea notes"
  on public.member_idea_notes for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all idea notes" on public.member_idea_notes;
create policy "Admins can select all idea notes"
  on public.member_idea_notes for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can insert their own idea notes" on public.member_idea_notes;
create policy "Users can insert their own idea notes"
  on public.member_idea_notes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.trading_ideas ti
      where ti.id = member_idea_notes.idea_id
    )
  );

drop policy if exists "Users can update their own idea notes" on public.member_idea_notes;
create policy "Users can update their own idea notes"
  on public.member_idea_notes for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own idea notes" on public.member_idea_notes;
create policy "Users can delete their own idea notes"
  on public.member_idea_notes for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Members can select tier-available software products" on public.software_products;
create policy "Members can select tier-available software products"
  on public.software_products for select
  to authenticated
  using (
    published = true
    and (select public.can_access_software(access_tier))
  );

drop policy if exists "Admins can select all software products" on public.software_products;
create policy "Admins can select all software products"
  on public.software_products for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can insert software products" on public.software_products;
create policy "Admins can insert software products"
  on public.software_products for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update software products" on public.software_products;
create policy "Admins can update software products"
  on public.software_products for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete software products" on public.software_products;
create policy "Admins can delete software products"
  on public.software_products for delete
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can select their own software access requests" on public.software_access_requests;
create policy "Users can select their own software access requests"
  on public.software_access_requests for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all software access requests" on public.software_access_requests;
create policy "Admins can select all software access requests"
  on public.software_access_requests for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can request software they can access" on public.software_access_requests;
create policy "Users can request software they can access"
  on public.software_access_requests for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'requested'
    and reviewed_by is null
    and reviewed_at is null
    and admin_note is null
    and exists (
      select 1
      from public.software_products sp
      where sp.id = software_access_requests.software_product_id
        and sp.published = true
        and public.can_access_software(sp.access_tier)
    )
  );

drop policy if exists "Users can update editable software request fields" on public.software_access_requests;
create policy "Users can update editable software request fields"
  on public.software_access_requests for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('requested', 'needs_info')
  )
  with check (
    user_id = (select auth.uid())
    and status in ('requested', 'needs_info')
  );

drop policy if exists "Admins can update software access requests" on public.software_access_requests;
create policy "Admins can update software access requests"
  on public.software_access_requests for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant usage on type public.member_dashboard_view to authenticated;
grant usage on type public.member_sort_preference to authenticated;
grant usage on type public.software_access_tier to authenticated;
grant usage on type public.software_type to authenticated;
grant usage on type public.software_delivery_type to authenticated;
grant usage on type public.software_access_request_status to authenticated;

grant select, insert, update, delete on public.saved_ideas to authenticated;
grant select, insert, update, delete on public.followed_tickers to authenticated;
grant select, insert, update on public.member_dashboard_preferences to authenticated;
grant select, insert, update, delete on public.member_idea_notes to authenticated;
grant select, insert, update, delete on public.software_products to authenticated;
grant select, insert, update on public.software_access_requests to authenticated;

comment on table public.saved_ideas is
  'Member-owned saved idea records for dashboard personalization. This does not track performance or execute trades.';
comment on table public.followed_tickers is
  'Member-owned followed ticker records for watchlist workflows. This is not a live market data feed.';
comment on table public.member_dashboard_preferences is
  'Member-owned dashboard display preferences for member-facing personalization.';
comment on table public.member_idea_notes is
  'Private member notes attached to ideas. Notes are owned by the member and available to admins only for support/debugging.';
comment on table public.software_products is
  'Tier-gated software library metadata. Do not store private Pine Script source code here by default; future code/download access must use protected storage and signed access.';
comment on table public.software_access_requests is
  'Manual software access request workflow. TradingView invite-only access remains a manual/admin process in Phase 8.';

comment on column public.software_products.access_tier is
  'Software access is member-only and tier-gated: premium_lite requires Premium or Pro; pro requires Pro. Admins can manage all products.';
comment on column public.software_products.delivery_type is
  'Delivery metadata only. This schema does not add automatic TradingView invites, payments, broker integrations, order execution, copy trading, live market data feeds, or email notifications.';
comment on column public.software_access_requests.status is
  'Regular users can request or provide more information only; admins control approval, grant, revoke, and review states.';
