-- Phase 8 follow-up: allow authenticated members to save published idea previews
-- even when full premium/pro idea rows are hidden by RLS.
--
-- This does not expose thesis, levels, update bodies, chart metadata, or any
-- other protected content. It only verifies that the referenced idea exists and
-- is published before allowing member-owned saved idea/note rows.

create or replace function public.can_reference_published_idea(p_idea_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.trading_ideas as idea
    where idea.id = p_idea_id
      and idea.published = true
  );
$$;

revoke all on function public.can_reference_published_idea(uuid) from public;
grant execute on function public.can_reference_published_idea(uuid)
  to authenticated;

drop policy if exists "Users can insert their own saved ideas" on public.saved_ideas;
create policy "Users can insert their own saved ideas"
  on public.saved_ideas for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.can_reference_published_idea(idea_id)
  );

drop policy if exists "Users can insert their own idea notes" on public.member_idea_notes;
create policy "Users can insert their own idea notes"
  on public.member_idea_notes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.can_reference_published_idea(idea_id)
  );

comment on function public.can_reference_published_idea(uuid) is
  'Allows member-owned saved idea and note records to reference published ideas without exposing protected premium/pro idea details.';
