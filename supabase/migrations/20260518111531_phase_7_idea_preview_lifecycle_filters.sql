-- Phase 7 lifecycle-aware idea preview filters.
--
-- These RPCs still return public-safe preview fields only. Lifecycle metadata
-- that could reveal member-only research context is returned only when
-- public.can_access_content(visibility) is true for the current request.
-- Locked premium/pro rows keep thesis, levels, update bodies, chart metadata,
-- outcome summaries, and private lifecycle detail protected.

drop function if exists public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer,
  text
);

drop function if exists public.get_trading_idea_preview_by_slug(text);

create or replace function public.get_trading_idea_previews(
  p_search text default null,
  p_asset_class public.asset_class default null,
  p_status public.idea_status default null,
  p_visibility public.content_visibility default null,
  p_limit integer default 24,
  p_offset integer default 0,
  p_sort text default 'published',
  p_outcome public.idea_outcome default null,
  p_updated_recently boolean default false,
  p_closed_reviews boolean default false
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
  outcome public.idea_outcome,
  last_lifecycle_event_at timestamptz,
  has_major_update boolean,
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
        when lower(trim(coalesce(p_sort, 'published'))) in (
          'closed',
          'lifecycle',
          'published',
          'updated'
        )
          then lower(trim(coalesce(p_sort, 'published')))
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
    case
      when public.can_access_content(idea.visibility) then idea.outcome
      else null
    end as outcome,
    case
      when public.can_access_content(idea.visibility)
        then idea.last_lifecycle_event_at
      else null
    end as last_lifecycle_event_at,
    case
      when public.can_access_content(idea.visibility) then exists (
        select 1
        from public.idea_updates as update_row
        where update_row.idea_id = idea.id
          and update_row.is_major = true
      )
      else false
    end as has_major_update,
    not public.can_access_content(idea.visibility) as is_locked
  from public.trading_ideas as idea
  cross join normalized_params as params
  where idea.published = true
    and (p_asset_class is null or idea.asset_class = p_asset_class)
    and (p_status is null or idea.status = p_status)
    and (p_visibility is null or idea.visibility = p_visibility)
    and (
      p_outcome is null
      or (
        public.can_access_content(idea.visibility)
        and idea.outcome = p_outcome
      )
    )
    and (
      coalesce(p_updated_recently, false) = false
      or idea.updated_at >= now() - interval '30 days'
    )
    and (
      coalesce(p_closed_reviews, false) = false
      or (
        public.can_access_content(idea.visibility)
        and idea.status = 'closed'
        and idea.review_published = true
      )
    )
    and (
      params.search_term is null
      or idea.title ilike '%' || params.search_term || '%'
      or idea.ticker ilike '%' || params.search_term || '%'
      or idea.public_preview ilike '%' || params.search_term || '%'
      or idea.setup_type ilike '%' || params.search_term || '%'
    )
  order by
    case
      when params.safe_sort = 'lifecycle'
        then idea.last_lifecycle_event_at
    end desc nulls last,
    case
      when params.safe_sort = 'lifecycle'
        then idea.updated_at
    end desc nulls last,
    case
      when params.safe_sort = 'closed'
        then idea.closed_at
    end desc nulls last,
    case
      when params.safe_sort = 'closed'
        then idea.last_lifecycle_event_at
    end desc nulls last,
    case
      when params.safe_sort = 'updated'
        then idea.updated_at
    end desc nulls last,
    case
      when params.safe_sort = 'updated'
        then idea.published_at
    end desc nulls last,
    case
      when params.safe_sort = 'published'
        then idea.published_at
    end desc nulls last,
    case
      when params.safe_sort = 'published'
        then idea.updated_at
    end desc nulls last,
    idea.published_at desc nulls last,
    idea.updated_at desc nulls last
  limit (select safe_limit from normalized_params)
  offset (select safe_offset from normalized_params);
$$;

create or replace function public.get_trading_idea_preview_by_slug(
  p_slug text
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
  outcome public.idea_outcome,
  last_lifecycle_event_at timestamptz,
  has_major_update boolean,
  is_locked boolean
)
language sql
stable
security definer
set search_path = public
as $$
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
    case
      when public.can_access_content(idea.visibility) then idea.outcome
      else null
    end as outcome,
    case
      when public.can_access_content(idea.visibility)
        then idea.last_lifecycle_event_at
      else null
    end as last_lifecycle_event_at,
    case
      when public.can_access_content(idea.visibility) then exists (
        select 1
        from public.idea_updates as update_row
        where update_row.idea_id = idea.id
          and update_row.is_major = true
      )
      else false
    end as has_major_update,
    not public.can_access_content(idea.visibility) as is_locked
  from public.trading_ideas as idea
  where idea.published = true
    and idea.slug = p_slug
  limit 1;
$$;

comment on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer,
  text,
  public.idea_outcome,
  boolean,
  boolean
) is 'Returns public-safe trading idea preview fields with lifecycle filters and sorting. Outcome, lifecycle date, and major-update metadata are only returned when the current user can access the full idea. Does not expose thesis, entry, invalidation, targets, chart details, update bodies, or paid research details.';

comment on function public.get_trading_idea_preview_by_slug(text) is
  'Returns a public-safe trading idea preview by slug. Lifecycle metadata is access-gated and full protected idea fields remain hidden.';

revoke all on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer,
  text,
  public.idea_outcome,
  boolean,
  boolean
) from public;

revoke all on function public.get_trading_idea_preview_by_slug(text) from public;

grant execute on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer,
  text,
  public.idea_outcome,
  boolean,
  boolean
) to anon, authenticated;

grant execute on function public.get_trading_idea_preview_by_slug(text)
  to anon, authenticated;
