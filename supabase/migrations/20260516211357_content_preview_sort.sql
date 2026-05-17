-- Add explicit sort support to safe trading idea preview RPCs.
--
-- This keeps dashboard widgets on the safe preview layer while allowing
-- recently-updated idea previews to be ordered by updated_at. Full premium/pro
-- content remains protected by existing RLS and is not returned here.

drop function if exists public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer
);

create or replace function public.get_trading_idea_previews(
  p_search text default null,
  p_asset_class public.asset_class default null,
  p_status public.idea_status default null,
  p_visibility public.content_visibility default null,
  p_limit integer default 24,
  p_offset integer default 0,
  p_sort text default 'published'
)
returns table (
  id uuid,
  title text,
  slug text,
  ticker text,
  asset_class public.asset_class,
  bias public.idea_bias,
  status public.idea_status,
  visibility public.content_visibility,
  timeframe text,
  setup_type text,
  risk_level public.risk_level,
  public_preview text,
  published_at timestamptz,
  updated_at timestamptz,
  is_locked boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with normalized_params as (
    select
      nullif(trim(p_search), '') as search_term,
      least(greatest(coalesce(p_limit, 24), 1), 100) as safe_limit,
      greatest(coalesce(p_offset, 0), 0) as safe_offset,
      case
        when lower(trim(coalesce(p_sort, 'published'))) = 'updated' then 'updated'
        else 'published'
      end as safe_sort
  )
  select
    idea.id,
    idea.title,
    idea.slug,
    idea.ticker,
    idea.asset_class,
    idea.bias,
    idea.status,
    idea.visibility,
    idea.timeframe,
    idea.setup_type,
    idea.risk_level,
    idea.public_preview,
    idea.published_at,
    idea.updated_at,
    not public.can_access_content(idea.visibility) as is_locked
  from public.trading_ideas as idea
  cross join normalized_params as params
  where idea.published = true
    and (p_asset_class is null or idea.asset_class = p_asset_class)
    and (p_status is null or idea.status = p_status)
    and (p_visibility is null or idea.visibility = p_visibility)
    and (
      params.search_term is null
      or idea.title ilike '%' || params.search_term || '%'
      or idea.ticker ilike '%' || params.search_term || '%'
      or idea.public_preview ilike '%' || params.search_term || '%'
      or idea.setup_type ilike '%' || params.search_term || '%'
    )
  order by
    case when params.safe_sort = 'updated' then idea.updated_at end desc nulls last,
    case when params.safe_sort = 'updated' then idea.published_at end desc nulls last,
    case when params.safe_sort = 'published' then idea.published_at end desc nulls last,
    case when params.safe_sort = 'published' then idea.updated_at end desc nulls last
  limit (select safe_limit from normalized_params)
  offset (select safe_offset from normalized_params);
$$;

comment on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer,
  text
) is 'Returns public-safe trading idea preview fields only, with published or updated sorting. Does not expose thesis, entry, invalidation, targets, or paid research details.';

revoke all on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer,
  text
) from public;

grant execute on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer,
  text
) to anon, authenticated;
