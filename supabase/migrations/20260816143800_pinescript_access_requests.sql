-- Allow Premium and Pro members to request manual access to any published Pine Script.

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
        and (
          public.can_access_software(sp.access_tier)
          or (
            sp.software_type = 'pinescript'::public.software_type
            and public.get_user_tier() in (
              'premium'::public.subscription_tier,
              'pro'::public.subscription_tier
            )
          )
        )
    )
  );

