-- Phase 7: structured idea lifecycle and educational outcome tracking.
-- These fields describe research status and review workflow only. They do not
-- represent broker integration, order execution, copy trading, or live trades.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'idea_outcome'
  ) then
    create type public.idea_outcome as enum (
      'pending',
      'no_trade',
      'invalidated',
      'stopped_out',
      'target_1_hit',
      'target_2_hit',
      'target_3_hit',
      'partial_win',
      'win',
      'loss',
      'breakeven',
      'closed_manual'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'idea_lifecycle_event_type'
  ) then
    create type public.idea_lifecycle_event_type as enum (
      'note',
      'status_change',
      'activated',
      'triggered',
      'target_hit',
      'invalidated',
      'closed',
      'review_posted'
    );
  end if;
end
$$;

alter table public.trading_ideas
  add column if not exists trigger_level text,
  add column if not exists triggered_at timestamptz,
  add column if not exists target_1_hit_at timestamptz,
  add column if not exists target_2_hit_at timestamptz,
  add column if not exists target_3_hit_at timestamptz,
  add column if not exists invalidated_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists outcome public.idea_outcome not null default 'pending',
  add column if not exists outcome_summary text,
  add column if not exists lessons_learned text,
  add column if not exists review_published boolean not null default false,
  add column if not exists review_published_at timestamptz,
  add column if not exists last_lifecycle_event_at timestamptz;

alter table public.idea_updates
  add column if not exists event_type public.idea_lifecycle_event_type not null default 'note',
  add column if not exists status_before public.idea_status,
  add column if not exists outcome_after public.idea_outcome,
  add column if not exists event_at timestamptz not null default now(),
  add column if not exists is_major boolean not null default false;

create table if not exists public.user_activity_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_dashboard_seen_at timestamptz,
  last_ideas_seen_at timestamptz,
  last_research_seen_at timestamptz,
  last_lifecycle_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_user_activity_state_updated_at
before update on public.user_activity_state
for each row execute function public.set_updated_at();

create index if not exists trading_ideas_status_outcome_idx
  on public.trading_ideas (status, outcome);

create index if not exists trading_ideas_last_lifecycle_event_at_idx
  on public.trading_ideas (last_lifecycle_event_at desc);

create index if not exists trading_ideas_closed_at_idx
  on public.trading_ideas (closed_at desc);

create index if not exists idea_updates_idea_id_event_at_idx
  on public.idea_updates (idea_id, event_at desc);

create index if not exists idea_updates_event_type_idx
  on public.idea_updates (event_type);

create index if not exists user_activity_state_user_id_idx
  on public.user_activity_state (user_id);

alter table public.user_activity_state enable row level security;

create policy user_activity_state_select_own
on public.user_activity_state
for select
to authenticated
using (user_id = auth.uid());

create policy user_activity_state_insert_own
on public.user_activity_state
for insert
to authenticated
with check (user_id = auth.uid());

create policy user_activity_state_update_own
on public.user_activity_state
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy user_activity_state_select_admin
on public.user_activity_state
for select
to authenticated
using ((select public.is_admin()));

create policy user_activity_state_update_admin
on public.user_activity_state
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant usage on type public.idea_outcome to anon, authenticated;
grant usage on type public.idea_lifecycle_event_type to anon, authenticated;

grant select, insert, update on public.user_activity_state to authenticated;

comment on type public.idea_outcome is
  'Educational outcome labels for reviewed research ideas. These are not broker/order execution states.';

comment on type public.idea_lifecycle_event_type is
  'Lifecycle event labels for idea update history, status changes, and review publication.';

comment on column public.trading_ideas.trigger_level is
  'Research trigger context only; not an order instruction or broker integration.';

comment on column public.trading_ideas.outcome is
  'Educational review outcome for a research idea. No trading results are guaranteed.';

comment on column public.trading_ideas.outcome_summary is
  'Educational outcome summary for closed or reviewed ideas.';

comment on column public.trading_ideas.lessons_learned is
  'Educational post-review notes for research improvement.';

comment on column public.trading_ideas.last_lifecycle_event_at is
  'Most recent lifecycle event timestamp for member-facing new-since-last-visit features.';

comment on table public.user_activity_state is
  'Per-user read markers for dashboard/content/lifecycle recency. Supports member-facing new-since-last-visit features and stores no broker/order execution data.';
