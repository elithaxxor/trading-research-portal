-- Phase 10 email notification infrastructure.
--
-- Content notification emails must use safe previews and protected links.
-- Premium/pro email eligibility must be checked again at send time.
-- Email preferences and unsubscribe groups must be respected before queueing
-- or sending. Transactional account/software status emails are separate from
-- marketing/content digest preferences. Stripe receipts remain handled by
-- Stripe unless explicitly changed later.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'notification_channel'
  ) then
    create type public.notification_channel as enum ('email');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'notification_category'
  ) then
    create type public.notification_category as enum (
      'content',
      'lifecycle',
      'digest',
      'software',
      'billing',
      'account',
      'system'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'email_notification_status'
  ) then
    create type public.email_notification_status as enum (
      'queued',
      'sending',
      'sent',
      'delivered',
      'failed',
      'bounced',
      'complained',
      'suppressed',
      'skipped',
      'canceled'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'email_unsubscribe_group'
  ) then
    create type public.email_unsubscribe_group as enum (
      'all',
      'content_updates',
      'lifecycle_updates',
      'weekly_digest',
      'software_updates',
      'billing_account'
    );
  end if;
end;
$$;

alter table public.email_notifications
  add column if not exists channel public.notification_channel not null default 'email',
  add column if not exists category public.notification_category,
  add column if not exists recipient_email text,
  add column if not exists provider text,
  add column if not exists provider_message_id text,
  add column if not exists template_key text,
  add column if not exists dedupe_key text,
  add column if not exists unsubscribe_group public.email_unsubscribe_group,
  add column if not exists subject text,
  add column if not exists preview_text text,
  add column if not exists html_body text,
  add column if not exists text_body text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists queued_at timestamptz not null default now(),
  add column if not exists send_after timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists complained_at timestamptz,
  add column if not exists suppressed_at timestamptz,
  add column if not exists retry_count integer not null default 0,
  add column if not exists max_retries integer not null default 3,
  add column if not exists last_error text,
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  status_type text;
begin
  select udt_name
  into status_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'email_notifications'
    and column_name = 'status';

  if status_type is null then
    execute 'alter table public.email_notifications
      add column status public.email_notification_status not null default ''queued''';
  elsif status_type <> 'email_notification_status' then
    execute 'alter table public.email_notifications alter column status drop default';
    execute 'alter table public.email_notifications
      alter column status type public.email_notification_status
      using (
        case status::text
          when ''pending'' then ''queued''
          when ''sent'' then ''sent''
          when ''failed'' then ''failed''
          else ''queued''
        end
      )::public.email_notification_status';
    execute 'alter table public.email_notifications
      alter column status set default ''queued''';
    execute 'alter table public.email_notifications
      alter column status set not null';
  else
    execute 'alter table public.email_notifications
      alter column status set default ''queued''';
    execute 'alter table public.email_notifications
      alter column status set not null';
  end if;
end;
$$;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  content_new_ideas boolean not null default false,
  content_idea_updates boolean not null default false,
  lifecycle_updates boolean not null default false,
  closed_reviews boolean not null default false,
  weekly_digest boolean not null default false,
  software_access_updates boolean not null default true,
  billing_account_updates boolean not null default true,
  digest_day_of_week integer not null default 1
    check (digest_day_of_week between 0 and 6),
  digest_time_utc time not null default '14:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  unsubscribe_group public.email_unsubscribe_group not null,
  token text not null unique,
  reason text,
  unsubscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.email_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text unique,
  email_notification_id uuid references public.email_notifications(id) on delete set null,
  provider_message_id text,
  event_type text not null,
  recipient_email text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create table if not exists public.email_digest_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  status text not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  error text
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_email_notifications_updated_at'
      and tgrelid = 'public.email_notifications'::regclass
  ) then
    execute 'create trigger set_email_notifications_updated_at
      before update on public.email_notifications
      for each row execute function public.set_updated_at()';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_notification_preferences_updated_at'
      and tgrelid = 'public.notification_preferences'::regclass
  ) then
    execute 'create trigger set_notification_preferences_updated_at
      before update on public.notification_preferences
      for each row execute function public.set_updated_at()';
  end if;
end;
$$;

create index if not exists email_notifications_user_id_created_at_idx
  on public.email_notifications(user_id, created_at desc);
create index if not exists email_notifications_status_send_after_idx
  on public.email_notifications(status, send_after);
create unique index if not exists email_notifications_dedupe_key_idx
  on public.email_notifications(dedupe_key);
create index if not exists email_notifications_provider_message_id_idx
  on public.email_notifications(provider_message_id);
create index if not exists email_notifications_category_created_at_idx
  on public.email_notifications(category, created_at desc);

create index if not exists notification_preferences_user_id_idx
  on public.notification_preferences(user_id);
create index if not exists email_unsubscribes_email_group_idx
  on public.email_unsubscribes(email, unsubscribe_group);
create index if not exists email_unsubscribes_token_idx
  on public.email_unsubscribes(token);
create index if not exists email_provider_events_provider_message_id_idx
  on public.email_provider_events(provider_message_id);
create index if not exists email_provider_events_event_type_received_at_idx
  on public.email_provider_events(event_type, received_at desc);
create index if not exists email_digest_runs_run_key_idx
  on public.email_digest_runs(run_key);
create index if not exists email_digest_runs_status_started_at_idx
  on public.email_digest_runs(status, started_at desc);

alter table public.notification_preferences enable row level security;
alter table public.email_unsubscribes enable row level security;
alter table public.email_provider_events enable row level security;
alter table public.email_digest_runs enable row level security;
alter table public.email_notifications enable row level security;

drop policy if exists "Users can select their own notification preferences"
  on public.notification_preferences;
create policy "Users can select their own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can insert their own notification preferences"
  on public.notification_preferences;
create policy "Users can insert their own notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own notification preferences"
  on public.notification_preferences;
create policy "Users can update their own notification preferences"
  on public.notification_preferences for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Admins can select all notification preferences"
  on public.notification_preferences;
create policy "Admins can select all notification preferences"
  on public.notification_preferences for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can select their own email notifications"
  on public.email_notifications;
create policy "Users can select their own email notifications"
  on public.email_notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all email notifications"
  on public.email_notifications;
create policy "Admins can select all email notifications"
  on public.email_notifications for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can insert email notifications"
  on public.email_notifications;
create policy "Admins can insert email notifications"
  on public.email_notifications for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update email notifications"
  on public.email_notifications;
create policy "Admins can update email notifications"
  on public.email_notifications for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete email notifications"
  on public.email_notifications;
create policy "Admins can delete email notifications"
  on public.email_notifications for delete
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can select linked unsubscribe rows"
  on public.email_unsubscribes;
create policy "Users can select linked unsubscribe rows"
  on public.email_unsubscribes for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can select all unsubscribe rows"
  on public.email_unsubscribes;
create policy "Admins can select all unsubscribe rows"
  on public.email_unsubscribes for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can select all email provider events"
  on public.email_provider_events;
create policy "Admins can select all email provider events"
  on public.email_provider_events for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can select all email digest runs"
  on public.email_digest_runs;
create policy "Admins can select all email digest runs"
  on public.email_digest_runs for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.notification_preferences from anon, authenticated;
revoke all on public.email_unsubscribes from anon, authenticated;
revoke all on public.email_provider_events from anon, authenticated;
revoke all on public.email_digest_runs from anon, authenticated;
revoke all on public.email_notifications from anon, authenticated;

grant usage on type public.notification_channel to anon, authenticated;
grant usage on type public.notification_category to anon, authenticated;
grant usage on type public.email_notification_status to anon, authenticated;
grant usage on type public.email_unsubscribe_group to anon, authenticated;

grant select, insert, update on public.notification_preferences to authenticated;
grant select on public.email_unsubscribes to authenticated;
grant select on public.email_provider_events to authenticated;
grant select on public.email_digest_runs to authenticated;
grant select, insert, update, delete on public.email_notifications to authenticated;

comment on table public.email_notifications is
  'Server-managed email queue and audit table. Content emails must use safe previews and protected app links.';
comment on table public.notification_preferences is
  'Per-user notification preferences. Preferences and unsubscribe groups must be respected before sending.';
comment on table public.email_unsubscribes is
  'Email unsubscribe records keyed by secure token. Public unsubscribe is handled through server routes, not direct client RLS.';
comment on table public.email_provider_events is
  'Provider webhook events for delivery, bounce, complaint, and suppression tracking.';
comment on table public.email_digest_runs is
  'Weekly digest processing runs and queue metrics for safe retry/audit workflows.';

comment on column public.email_notifications.channel is
  'Notification channel. Phase 10 supports email only.';
comment on column public.email_notifications.category is
  'High-level notification category used for preferences, admin filtering, and unsubscribe behavior.';
comment on column public.email_notifications.status is
  'Queue and provider status. Regular users cannot mutate notification queue rows.';
comment on column public.email_notifications.dedupe_key is
  'Unique key used to avoid duplicate queue rows for the same logical notification.';
comment on column public.email_notifications.unsubscribe_group is
  'Unsubscribe group that must be checked before sending non-transactional email.';
comment on column public.email_notifications.preview_text is
  'Safe preview text only. Do not store premium/pro private research details for unauthorized email recipients.';
comment on column public.email_notifications.html_body is
  'Rendered email body. Do not render arbitrary user HTML and do not include locked research details.';
comment on column public.email_notifications.text_body is
  'Plain-text email body. Prefer safe summaries that link back to protected app pages.';
comment on column public.notification_preferences.billing_account_updates is
  'Transactional account/billing updates are separate from marketing/content digest preferences.';
comment on column public.email_provider_events.payload is
  'Raw provider event payload for audit/debugging. Do not expose this table to regular users.';
comment on column public.email_digest_runs.run_key is
  'Idempotency key for scheduled/manual digest runs.';
