-- Trading Research Portal safe content preview layer.
--
-- Postgres RLS protects rows, not individual fields. These RPC functions are
-- intentionally limited to public-safe preview fields so public listing pages
-- can show premium/pro teasers without exposing full thesis, levels, targets,
-- chart details, or paid research bodies.
--
-- Full premium/pro trading_ideas and posts rows remain protected by the
-- existing RLS policies.

alter table public.trading_ideas
add column if not exists public_preview text;

comment on column public.trading_ideas.public_preview is
  'Public-safe preview copy for idea cards. Do not store proprietary thesis, exact levels, targets, or paid setup details here.';

create or replace function public.get_trading_idea_previews(
  p_search text default null,
  p_asset_class public.asset_class default null,
  p_status public.idea_status default null,
  p_visibility public.content_visibility default null,
  p_limit integer default 24,
  p_offset integer default 0
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
      greatest(coalesce(p_offset, 0), 0) as safe_offset
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
  order by idea.published_at desc nulls last, idea.updated_at desc
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
    not public.can_access_content(idea.visibility) as is_locked
  from public.trading_ideas as idea
  where idea.published = true
    and idea.slug = p_slug
  limit 1;
$$;

create or replace function public.get_post_previews(
  p_search text default null,
  p_visibility public.content_visibility default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  slug text,
  excerpt text,
  visibility public.content_visibility,
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
      greatest(coalesce(p_offset, 0), 0) as safe_offset
  )
  select
    post.id,
    post.title,
    post.slug,
    post.excerpt,
    post.visibility,
    post.published_at,
    post.updated_at,
    not public.can_access_content(post.visibility) as is_locked
  from public.posts as post
  cross join normalized_params as params
  where post.published = true
    and (p_visibility is null or post.visibility = p_visibility)
    and (
      params.search_term is null
      or post.title ilike '%' || params.search_term || '%'
      or post.excerpt ilike '%' || params.search_term || '%'
    )
  order by post.published_at desc nulls last, post.updated_at desc
  limit (select safe_limit from normalized_params)
  offset (select safe_offset from normalized_params);
$$;

create or replace function public.get_post_preview_by_slug(
  p_slug text
)
returns table (
  id uuid,
  title text,
  slug text,
  excerpt text,
  visibility public.content_visibility,
  published_at timestamptz,
  updated_at timestamptz,
  is_locked boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    post.id,
    post.title,
    post.slug,
    post.excerpt,
    post.visibility,
    post.published_at,
    post.updated_at,
    not public.can_access_content(post.visibility) as is_locked
  from public.posts as post
  where post.published = true
    and post.slug = p_slug
  limit 1;
$$;

comment on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer
) is 'Returns public-safe trading idea preview fields only. Does not expose thesis, entry, invalidation, targets, or paid research details.';

comment on function public.get_trading_idea_preview_by_slug(text) is
  'Returns a public-safe trading idea preview by slug. Does not expose full protected trading idea fields.';

comment on function public.get_post_previews(
  text,
  public.content_visibility,
  integer,
  integer
) is 'Returns public-safe post preview fields only. Full post bodies remain protected by RLS.';

comment on function public.get_post_preview_by_slug(text) is
  'Returns a public-safe post preview by slug. Full post bodies remain protected by RLS.';

revoke all on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer
) from public;
revoke all on function public.get_trading_idea_preview_by_slug(text) from public;
revoke all on function public.get_post_previews(
  text,
  public.content_visibility,
  integer,
  integer
) from public;
revoke all on function public.get_post_preview_by_slug(text) from public;

grant execute on function public.get_trading_idea_previews(
  text,
  public.asset_class,
  public.idea_status,
  public.content_visibility,
  integer,
  integer
) to anon, authenticated;
grant execute on function public.get_trading_idea_preview_by_slug(text)
  to anon, authenticated;
grant execute on function public.get_post_previews(
  text,
  public.content_visibility,
  integer,
  integer
) to anon, authenticated;
grant execute on function public.get_post_preview_by_slug(text)
  to anon, authenticated;
