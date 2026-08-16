-- Premium and Pro Pine Script member library with private downloads.
-- Individual purchase metadata is intentionally non-transactional until pricing is approved.

alter table public.software_products
  add column if not exists member_download_enabled boolean not null default false,
  add column if not exists individual_purchase_enabled boolean not null default false,
  add column if not exists individual_price_cents integer,
  add column if not exists download_storage_path text,
  add column if not exists download_file_name text;

alter table public.software_products
  drop constraint if exists software_products_individual_price_cents_check;

alter table public.software_products
  add constraint software_products_individual_price_cents_check
  check (individual_price_cents is null or individual_price_cents >= 0);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pinescript-files',
  'pinescript-files',
  false,
  1048576,
  array['text/plain', 'application/octet-stream']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can select tier-available software products" on public.software_products;
create policy "Members can select tier-available software products"
  on public.software_products for select
  to authenticated
  using (
    published = true
    and (
      (select public.can_access_software(access_tier))
      or (
        software_type = 'pinescript'::public.software_type
        and (select public.get_user_tier()) in (
          'premium'::public.subscription_tier,
          'pro'::public.subscription_tier
        )
      )
    )
  );

comment on column public.software_products.member_download_enabled is
  'Allows active Premium and Pro members to request a protected Pine Script download when a private storage path exists.';
comment on column public.software_products.individual_purchase_enabled is
  'Catalog-only readiness flag. It does not create a price, accept payment, or grant access.';
comment on column public.software_products.individual_price_cents is
  'Reserved for a later explicitly approved individual-purchase flow. Null means pricing is not configured.';
comment on column public.software_products.download_storage_path is
  'Private Supabase Storage path. Never render this value in public or member client output.';
comment on column public.software_products.download_file_name is
  'Safe member-facing download filename for a protected Pine Script file.';
