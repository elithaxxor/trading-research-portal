-- Phase 11 operations, analytics, and launch readiness infrastructure.
--
-- Ops events are product/operations analytics only. Do not store sensitive
-- secrets, private content bodies, card data, or Pine Script source code in
-- ops metadata. Ops readiness gates document launch state only; they do not
-- enable live billing, production email sending, broker integration, order
-- execution, copy trading, or live market data feeds.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'ops_check_status'
  ) then
    create type public.ops_check_status as enum (
      'pending',
      'passing',
      'warning',
      'failing',
      'blocked',
      'skipped'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'ops_check_category'
  ) then
    create type public.ops_check_category as enum (
      'app_health',
      'auth',
      'database',
      'content',
      'billing',
      'email',
      'software',
      'security',
      'legal',
      'deployment',
      'analytics',
      'launch'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'analytics_event_source'
  ) then
    create type public.analytics_event_source as enum (
      'server',
      'client',
      'webhook',
      'admin',
      'system'
    );
  end if;
end;
$$;

create table if not exists public.ops_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  category public.ops_check_category not null,
  status public.ops_check_status not null default 'pending',
  description text,
  owner text,
  evidence_url text,
  evidence_note text,
  last_checked_at timestamptz,
  due_at timestamptz,
  blocking_launch boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_events (
  id uuid primary key default gen_random_uuid(),
  source public.analytics_event_source not null default 'server',
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  route text,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.ops_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'open',
  severity text not null default 'low',
  summary text,
  affected_area text,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_notes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  area text not null,
  title text not null,
  body text,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_ops_readiness_checks_updated_at'
      and tgrelid = 'public.ops_readiness_checks'::regclass
  ) then
    execute 'create trigger set_ops_readiness_checks_updated_at
      before update on public.ops_readiness_checks
      for each row execute function public.set_updated_at()';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_ops_incidents_updated_at'
      and tgrelid = 'public.ops_incidents'::regclass
  ) then
    execute 'create trigger set_ops_incidents_updated_at
      before update on public.ops_incidents
      for each row execute function public.set_updated_at()';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_admin_audit_notes_updated_at'
      and tgrelid = 'public.admin_audit_notes'::regclass
  ) then
    execute 'create trigger set_admin_audit_notes_updated_at
      before update on public.admin_audit_notes
      for each row execute function public.set_updated_at()';
  end if;
end;
$$;

create index if not exists ops_readiness_checks_category_status_idx
  on public.ops_readiness_checks(category, status);
create index if not exists ops_readiness_checks_blocking_status_idx
  on public.ops_readiness_checks(blocking_launch, status);
create index if not exists ops_events_event_name_created_at_idx
  on public.ops_events(event_name, created_at desc);
create index if not exists ops_events_user_created_at_idx
  on public.ops_events(user_id, created_at desc);
create index if not exists ops_events_entity_idx
  on public.ops_events(entity_type, entity_id);
create index if not exists ops_incidents_status_severity_idx
  on public.ops_incidents(status, severity);
create index if not exists ops_incidents_created_at_idx
  on public.ops_incidents(created_at desc);
create index if not exists admin_audit_notes_area_created_at_idx
  on public.admin_audit_notes(area, created_at desc);
create index if not exists admin_audit_notes_related_entity_idx
  on public.admin_audit_notes(related_entity_type, related_entity_id);

alter table public.ops_readiness_checks enable row level security;
alter table public.ops_events enable row level security;
alter table public.ops_incidents enable row level security;
alter table public.admin_audit_notes enable row level security;

drop policy if exists "Admins can select ops readiness checks"
  on public.ops_readiness_checks;
create policy "Admins can select ops readiness checks"
  on public.ops_readiness_checks for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can insert ops readiness checks"
  on public.ops_readiness_checks;
create policy "Admins can insert ops readiness checks"
  on public.ops_readiness_checks for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update ops readiness checks"
  on public.ops_readiness_checks;
create policy "Admins can update ops readiness checks"
  on public.ops_readiness_checks for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete ops readiness checks"
  on public.ops_readiness_checks;
create policy "Admins can delete ops readiness checks"
  on public.ops_readiness_checks for delete
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can select ops events"
  on public.ops_events;
create policy "Admins can select ops events"
  on public.ops_events for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can insert ops events"
  on public.ops_events;
create policy "Admins can insert ops events"
  on public.ops_events for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can select ops incidents"
  on public.ops_incidents;
create policy "Admins can select ops incidents"
  on public.ops_incidents for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can insert ops incidents"
  on public.ops_incidents;
create policy "Admins can insert ops incidents"
  on public.ops_incidents for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update ops incidents"
  on public.ops_incidents;
create policy "Admins can update ops incidents"
  on public.ops_incidents for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete ops incidents"
  on public.ops_incidents;
create policy "Admins can delete ops incidents"
  on public.ops_incidents for delete
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can select admin audit notes"
  on public.admin_audit_notes;
create policy "Admins can select admin audit notes"
  on public.admin_audit_notes for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can insert admin audit notes"
  on public.admin_audit_notes;
create policy "Admins can insert admin audit notes"
  on public.admin_audit_notes for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update admin audit notes"
  on public.admin_audit_notes;
create policy "Admins can update admin audit notes"
  on public.admin_audit_notes for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete admin audit notes"
  on public.admin_audit_notes;
create policy "Admins can delete admin audit notes"
  on public.admin_audit_notes for delete
  to authenticated
  using ((select public.is_admin()));

revoke all on public.ops_readiness_checks from anon, authenticated;
revoke all on public.ops_events from anon, authenticated;
revoke all on public.ops_incidents from anon, authenticated;
revoke all on public.admin_audit_notes from anon, authenticated;

grant usage on type public.ops_check_status to authenticated;
grant usage on type public.ops_check_category to authenticated;
grant usage on type public.analytics_event_source to authenticated;

grant select, insert, update, delete on public.ops_readiness_checks to authenticated;
grant select, insert on public.ops_events to authenticated;
grant select, insert, update, delete on public.ops_incidents to authenticated;
grant select, insert, update, delete on public.admin_audit_notes to authenticated;

insert into public.ops_readiness_checks (
  key,
  title,
  category,
  status,
  description,
  blocking_launch,
  metadata
) values
  (
    'production_email_sender_verified',
    'Production email sender verified',
    'email',
    'pending',
    'Confirm the approved production sender/domain is verified with the provider before real sending.',
    true,
    '{"phase": 11, "launch_area": "email"}'
  ),
  (
    'production_email_spf_dkim_dmarc_reviewed',
    'Production email SPF/DKIM/DMARC reviewed',
    'email',
    'pending',
    'Confirm SPF, DKIM, return-path, and DMARC posture are reviewed before enabling production email.',
    true,
    '{"phase": 11, "launch_area": "email"}'
  ),
  (
    'production_email_legal_approved',
    'Production email legal copy approved',
    'legal',
    'pending',
    'Confirm notification language, unsubscribe behavior, and support workflow are legally/business approved.',
    true,
    '{"phase": 11, "launch_area": "email"}'
  ),
  (
    'production_email_send_enabled_approved',
    'Production email send enablement approved',
    'email',
    'pending',
    'Confirm explicit approval exists before setting production EMAIL_SEND_ENABLED=true or scheduling sends.',
    true,
    '{"phase": 11, "launch_area": "email"}'
  ),
  (
    'live_stripe_keys_configured',
    'Live Stripe keys configured',
    'billing',
    'pending',
    'Confirm live Stripe keys and price IDs are intentionally configured only when live subscriptions are approved.',
    true,
    '{"phase": 11, "launch_area": "billing"}'
  ),
  (
    'live_stripe_webhook_configured',
    'Live Stripe webhook configured',
    'billing',
    'pending',
    'Confirm the production Stripe webhook endpoint and signing secret are configured before live billing.',
    true,
    '{"phase": 11, "launch_area": "billing"}'
  ),
  (
    'live_stripe_legal_approved',
    'Live Stripe legal/business approval complete',
    'legal',
    'pending',
    'Confirm subscription terms, refunds, pricing, support, and launch approval are complete before live billing.',
    true,
    '{"phase": 11, "launch_area": "billing"}'
  ),
  (
    'production_supabase_project_separated_or_approved',
    'Production Supabase project separation approved',
    'database',
    'pending',
    'Confirm production Supabase usage is separated from test data or explicitly approved for launch.',
    true,
    '{"phase": 11, "launch_area": "database"}'
  ),
  (
    'production_admin_smoke_tested',
    'Production admin smoke tested',
    'auth',
    'pending',
    'Confirm admin login, protected admin routes, and core admin workflows are smoke-tested in production.',
    true,
    '{"phase": 11, "launch_area": "operations"}'
  ),
  (
    'premium_pro_leak_checks_passed',
    'Premium/pro leak checks passed',
    'security',
    'pending',
    'Confirm no premium/pro content, private chart data, or Pine Script source leaks to unauthorized users.',
    true,
    '{"phase": 11, "launch_area": "security"}'
  ),
  (
    'software_access_model_verified',
    'Software access model verified',
    'software',
    'pending',
    'Confirm free, Premium, Pro, inactive, and admin software access behavior still matches launch rules.',
    true,
    '{"phase": 11, "launch_area": "software"}'
  ),
  (
    'pricing_copy_reviewed',
    'Pricing copy reviewed',
    'content',
    'pending',
    'Confirm pricing copy, disclaimers, and access descriptions match approved launch posture.',
    true,
    '{"phase": 11, "launch_area": "legal_copy"}'
  ),
  (
    'refund_policy_reviewed',
    'Refund policy reviewed',
    'legal',
    'pending',
    'Confirm refund and cancellation policy is approved before live subscriptions.',
    true,
    '{"phase": 11, "launch_area": "legal_copy"}'
  ),
  (
    'privacy_policy_reviewed',
    'Privacy policy reviewed',
    'legal',
    'pending',
    'Confirm privacy disclosures cover analytics, email notifications, payment processor, and operational logging.',
    true,
    '{"phase": 11, "launch_area": "legal_copy"}'
  ),
  (
    'backup_restore_plan_reviewed',
    'Backup and restore plan reviewed',
    'database',
    'pending',
    'Confirm database backup, restore, and rollback expectations are reviewed before launch.',
    true,
    '{"phase": 11, "launch_area": "operations"}'
  ),
  (
    'incident_response_runbook_reviewed',
    'Incident response runbook reviewed',
    'launch',
    'pending',
    'Confirm incident triage, escalation, rollback, and support response runbook is reviewed before launch.',
    true,
    '{"phase": 11, "launch_area": "operations"}'
  )
on conflict (key) do nothing;

comment on table public.ops_readiness_checks is
  'Admin-managed launch readiness checklist. These gates document readiness only and do not enable live billing or email sending.';
comment on table public.ops_events is
  'Product and operations analytics events for admin visibility. Do not store secrets, card data, private content bodies, or Pine Script source code.';
comment on table public.ops_incidents is
  'Admin-managed incident records for operational triage, launch blockers, and resolution notes.';
comment on table public.admin_audit_notes is
  'Admin-only operational notes for readiness decisions, support context, and launch runbook tracking.';

comment on column public.ops_readiness_checks.metadata is
  'Operational metadata only. Do not store secrets, private content bodies, card data, or Pine Script source code.';
comment on column public.ops_events.metadata is
  'Analytics metadata only. Do not store secrets, private content bodies, card data, or Pine Script source code.';
comment on column public.ops_incidents.metadata is
  'Incident metadata only. Do not store secrets, private content bodies, card data, or Pine Script source code.';
comment on column public.admin_audit_notes.body is
  'Admin note body for operational context. Do not store secrets, private content bodies, card data, or Pine Script source code.';
