-- Public-safe Pine Script catalog metadata. Private descriptions, documentation,
-- storage paths, source files, and member entitlement fields are excluded.

create or replace function public.list_public_pinescripts()
returns table (
  id uuid,
  title text,
  slug text,
  short_description text,
  version text,
  published_at timestamptz,
  updated_at timestamptz,
  individual_purchase_enabled boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sp.id,
    sp.title,
    sp.slug,
    sp.short_description,
    sp.version,
    sp.published_at,
    sp.updated_at,
    sp.individual_purchase_enabled
  from public.software_products sp
  where sp.published = true
    and sp.software_type = 'pinescript'::public.software_type
  order by sp.published_at desc nulls last, sp.updated_at desc;
$$;

revoke all on function public.list_public_pinescripts() from public;
grant execute on function public.list_public_pinescripts() to anon, authenticated;

comment on function public.list_public_pinescripts() is
  'Returns public-safe Pine Script catalog metadata only. It never exposes source files, private documentation, storage paths, or purchase entitlements.';

