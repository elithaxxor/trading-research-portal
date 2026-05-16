-- Trading Research Portal Row Level Security policies.
--
-- Access model:
-- - Free published research can be read publicly.
-- - Premium and pro published research require an authenticated user with an
--   active or trialing subscription tier that is high enough.
-- - Admins can manage research content and subscription metadata.
-- - Users own their profiles, subscriptions, watchlists, and notification
--   visibility at the row level, but regular users cannot modify subscription
--   or research records directly.
--
-- This migration only protects the database schema. Auth UI, protected routes,
-- Stripe webhooks, dashboard queries, and admin mutations are intentionally not
-- implemented in the application yet.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select profiles.role = 'admin'::public.app_role
      from public.profiles
      where profiles.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.get_user_tier()
returns public.subscription_tier
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_tier public.subscription_tier;
begin
  if current_user_id is null then
    return 'free'::public.subscription_tier;
  end if;

  if public.is_admin() then
    return 'pro'::public.subscription_tier;
  end if;

  select subscriptions.tier
    into current_tier
  from public.subscriptions
  where subscriptions.user_id = current_user_id
    and subscriptions.status in (
      'active'::public.subscription_status,
      'trialing'::public.subscription_status
    )
  limit 1;

  if current_tier in ('premium'::public.subscription_tier, 'pro'::public.subscription_tier) then
    return current_tier;
  end if;

  return 'free'::public.subscription_tier;
end;
$$;

create or replace function public.can_access_content(
  required_visibility public.content_visibility
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_tier public.subscription_tier;
begin
  if required_visibility = 'free'::public.content_visibility then
    return true;
  end if;

  if current_user_id is null then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  current_tier := public.get_user_tier();

  if required_visibility = 'premium'::public.content_visibility then
    return current_tier in (
      'premium'::public.subscription_tier,
      'pro'::public.subscription_tier
    );
  end if;

  if required_visibility = 'pro'::public.content_visibility then
    return current_tier = 'pro'::public.subscription_tier;
  end if;

  return false;
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.get_user_tier() from public;
revoke all on function public.can_access_content(public.content_visibility) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_user_tier() to authenticated;
grant execute on function public.can_access_content(public.content_visibility) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.trading_ideas enable row level security;
alter table public.idea_updates enable row level security;
alter table public.idea_charts enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.idea_tags enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.email_notifications enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_select_admin
on public.profiles
for select
to authenticated
using ((select public.is_admin()));

create policy profiles_update_admin
on public.profiles
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy profiles_delete_admin
on public.profiles
for delete
to authenticated
using ((select public.is_admin()));

create policy subscriptions_select_own
on public.subscriptions
for select
to authenticated
using (user_id = (select auth.uid()));

create policy subscriptions_select_admin
on public.subscriptions
for select
to authenticated
using ((select public.is_admin()));

create policy subscriptions_insert_admin
on public.subscriptions
for insert
to authenticated
with check ((select public.is_admin()));

create policy subscriptions_update_admin
on public.subscriptions
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy subscriptions_delete_admin
on public.subscriptions
for delete
to authenticated
using ((select public.is_admin()));

create policy trading_ideas_select_published_free
on public.trading_ideas
for select
to anon, authenticated
using (
  published = true
  and visibility = 'free'::public.content_visibility
);

create policy trading_ideas_select_published_accessible
on public.trading_ideas
for select
to authenticated
using (
  published = true
  and (select public.can_access_content(visibility))
);

create policy trading_ideas_select_admin
on public.trading_ideas
for select
to authenticated
using ((select public.is_admin()));

create policy trading_ideas_insert_admin
on public.trading_ideas
for insert
to authenticated
with check ((select public.is_admin()));

create policy trading_ideas_update_admin
on public.trading_ideas
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy trading_ideas_delete_admin
on public.trading_ideas
for delete
to authenticated
using ((select public.is_admin()));

create policy posts_select_published_free
on public.posts
for select
to anon, authenticated
using (
  published = true
  and visibility = 'free'::public.content_visibility
);

create policy posts_select_published_accessible
on public.posts
for select
to authenticated
using (
  published = true
  and (select public.can_access_content(visibility))
);

create policy posts_select_admin
on public.posts
for select
to authenticated
using ((select public.is_admin()));

create policy posts_insert_admin
on public.posts
for insert
to authenticated
with check ((select public.is_admin()));

create policy posts_update_admin
on public.posts
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy posts_delete_admin
on public.posts
for delete
to authenticated
using ((select public.is_admin()));

create policy idea_updates_select_accessible_parent
on public.idea_updates
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.trading_ideas as parent_idea
    where parent_idea.id = idea_updates.idea_id
      and parent_idea.published = true
      and (select public.can_access_content(parent_idea.visibility))
  )
);

create policy idea_updates_select_admin
on public.idea_updates
for select
to authenticated
using ((select public.is_admin()));

create policy idea_updates_insert_admin
on public.idea_updates
for insert
to authenticated
with check ((select public.is_admin()));

create policy idea_updates_update_admin
on public.idea_updates
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy idea_updates_delete_admin
on public.idea_updates
for delete
to authenticated
using ((select public.is_admin()));

create policy idea_charts_select_accessible_parent
on public.idea_charts
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.trading_ideas as parent_idea
    where parent_idea.id = idea_charts.idea_id
      and parent_idea.published = true
      and (select public.can_access_content(parent_idea.visibility))
  )
);

create policy idea_charts_select_admin
on public.idea_charts
for select
to authenticated
using ((select public.is_admin()));

create policy idea_charts_insert_admin
on public.idea_charts
for insert
to authenticated
with check ((select public.is_admin()));

create policy idea_charts_update_admin
on public.idea_charts
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy idea_charts_delete_admin
on public.idea_charts
for delete
to authenticated
using ((select public.is_admin()));

create policy tags_select_all
on public.tags
for select
to anon, authenticated
using (true);

create policy tags_insert_admin
on public.tags
for insert
to authenticated
with check ((select public.is_admin()));

create policy tags_update_admin
on public.tags
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy tags_delete_admin
on public.tags
for delete
to authenticated
using ((select public.is_admin()));

create policy idea_tags_select_accessible_parent
on public.idea_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.trading_ideas as parent_idea
    where parent_idea.id = idea_tags.idea_id
      and parent_idea.published = true
      and (select public.can_access_content(parent_idea.visibility))
  )
);

create policy idea_tags_insert_admin
on public.idea_tags
for insert
to authenticated
with check ((select public.is_admin()));

create policy idea_tags_update_admin
on public.idea_tags
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy idea_tags_delete_admin
on public.idea_tags
for delete
to authenticated
using ((select public.is_admin()));

create policy watchlist_items_select_own
on public.watchlist_items
for select
to authenticated
using (user_id = (select auth.uid()));

create policy watchlist_items_select_admin
on public.watchlist_items
for select
to authenticated
using ((select public.is_admin()));

create policy watchlist_items_insert_own
on public.watchlist_items
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy watchlist_items_update_own
on public.watchlist_items
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy watchlist_items_delete_own
on public.watchlist_items
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy email_notifications_select_own
on public.email_notifications
for select
to authenticated
using (user_id = (select auth.uid()));

create policy email_notifications_select_admin
on public.email_notifications
for select
to authenticated
using ((select public.is_admin()));

create policy email_notifications_insert_admin
on public.email_notifications
for insert
to authenticated
with check ((select public.is_admin()));

create policy email_notifications_update_admin
on public.email_notifications
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy email_notifications_delete_admin
on public.email_notifications
for delete
to authenticated
using ((select public.is_admin()));

grant usage on schema public to anon, authenticated;

grant usage on type public.app_role to anon, authenticated;
grant usage on type public.subscription_tier to anon, authenticated;
grant usage on type public.subscription_status to anon, authenticated;
grant usage on type public.content_visibility to anon, authenticated;
grant usage on type public.asset_class to anon, authenticated;
grant usage on type public.idea_bias to anon, authenticated;
grant usage on type public.idea_status to anon, authenticated;
grant usage on type public.risk_level to anon, authenticated;
grant usage on type public.chart_type to anon, authenticated;
grant usage on type public.notification_type to anon, authenticated;
grant usage on type public.notification_status to anon, authenticated;

grant select on public.trading_ideas to anon, authenticated;
grant select on public.idea_updates to anon, authenticated;
grant select on public.idea_charts to anon, authenticated;
grant select on public.posts to anon, authenticated;
grant select on public.tags to anon, authenticated;
grant select on public.idea_tags to anon, authenticated;

grant select, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.trading_ideas to authenticated;
grant select, insert, update, delete on public.idea_updates to authenticated;
grant select, insert, update, delete on public.idea_charts to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, update, delete on public.idea_tags to authenticated;
grant select, insert, update, delete on public.watchlist_items to authenticated;
grant select, insert, update, delete on public.email_notifications to authenticated;
