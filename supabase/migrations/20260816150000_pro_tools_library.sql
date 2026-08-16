-- Pro/Admin-only tools library. A tool cannot become Premium-accessible through
-- an incorrectly configured general software access tier.

drop policy if exists "Members can select tier-available software products" on public.software_products;
create policy "Members can select tier-available software products"
  on public.software_products for select
  to authenticated
  using (
    published = true
    and case
      when software_type = 'tool'::public.software_type then
        (select public.get_user_tier()) = 'pro'::public.subscription_tier
      when software_type = 'pinescript'::public.software_type then
        (select public.get_user_tier()) in (
          'premium'::public.subscription_tier,
          'pro'::public.subscription_tier
        )
      else
        (select public.can_access_software(access_tier))
    end
  );

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
        and case
          when sp.software_type = 'tool'::public.software_type then
            public.get_user_tier() = 'pro'::public.subscription_tier
          when sp.software_type = 'pinescript'::public.software_type then
            public.get_user_tier() in (
              'premium'::public.subscription_tier,
              'pro'::public.subscription_tier
            )
          else
            public.can_access_software(sp.access_tier)
        end
    )
  );

comment on column public.software_products.software_type is
  'Products marked tool are available only to active Pro members and admins. Pine Scripts are available to active Premium and Pro members.';

