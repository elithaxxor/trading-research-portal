-- Trading Research Portal local development seed data.
--
-- These records are educational samples for local Supabase testing only.
-- They are not market recommendations, financial advice, performance claims,
-- or production trading research.
--
-- This file intentionally does not seed auth.users, customer emails, Stripe
-- identifiers, passwords, or payment records.

insert into public.tags (id, name, slug)
values
  ('11111111-1111-4111-8111-111111111111', 'Market Outlook', 'market-outlook'),
  ('11111111-1111-4111-8111-111111111112', 'Risk Management', 'risk-management'),
  ('11111111-1111-4111-8111-111111111113', 'Swing Trading', 'swing-trading'),
  ('11111111-1111-4111-8111-111111111114', 'Indexes', 'indexes'),
  ('11111111-1111-4111-8111-111111111115', 'Education', 'education')
on conflict (slug) do update
set name = excluded.name;

insert into public.trading_ideas (
  id,
  title,
  slug,
  ticker,
  asset_class,
  bias,
  status,
  visibility,
  timeframe,
  setup_type,
  entry_zone,
  invalidation_level,
  target_1,
  target_2,
  target_3,
  risk_level,
  summary,
  thesis,
  position_disclosure,
  risk_disclosure,
  educational_purpose_only,
  published,
  published_at
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    'Example SPY Risk-Defined Watch',
    'example-spy-risk-defined-watch',
    'SPY',
    'etf',
    'watch',
    'watching',
    'free',
    'Swing',
    'Risk-defined index watch',
    'Illustrative trigger area only; not a trade recommendation.',
    'Illustrative invalidation level only; not financial advice.',
    'Educational upside scenario one.',
    'Educational upside scenario two.',
    null,
    'medium',
    'Educational sample showing how a risk-defined watch record may be organized for review.',
    'This local sample demonstrates thesis structure, invalidation planning, and update history without recommending a trade.',
    'No position disclosure for this educational sample.',
    'Educational example only. Not financial advice.',
    true,
    true,
    '2026-01-05 14:30:00+00'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'Example QQQ Market Structure Note',
    'example-qqq-market-structure-note',
    'QQQ',
    'etf',
    'neutral',
    'watching',
    'free',
    'Multi-day',
    'Market structure study',
    'Example observation area only; not a trade recommendation.',
    'Example invalidation framework only.',
    'Educational review zone one.',
    'Educational review zone two.',
    null,
    'medium',
    'Educational sample for organizing market structure observations without implying a forecast.',
    'This local development record demonstrates how index notes can describe scenarios, risk, and alternate paths.',
    'No position disclosure for this educational sample.',
    'Educational example only. Not financial advice.',
    true,
    true,
    '2026-01-06 14:30:00+00'
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'Example NVDA Premium Research Card',
    'example-nvda-premium-research-card',
    'NVDA',
    'stock',
    'watch',
    'watching',
    'premium',
    'Swing',
    'Premium research preview',
    'Local sample trigger area only; not an actual setup.',
    'Local sample invalidation area only; not financial advice.',
    'Educational premium scenario one.',
    'Educational premium scenario two.',
    'Educational premium scenario three.',
    'high',
    'Premium-visibility local sample showing how a research card may be structured for members.',
    'This record is a local development preview of premium content organization and does not claim an actual trade recommendation.',
    'No position disclosure for this educational sample.',
    'Educational example only. Not financial advice.',
    true,
    true,
    '2026-01-07 14:30:00+00'
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    'Example Macro Pro Research Note',
    'example-macro-pro-research-note',
    'MACRO',
    'macro',
    'neutral',
    'watching',
    'pro',
    'Weekly',
    'Macro scenario review',
    'Educational scenario area only.',
    'Educational invalidation framework only.',
    'Scenario review point one.',
    'Scenario review point two.',
    null,
    'medium',
    'Pro-visibility local sample for organizing macro observations and risk context.',
    'This educational local record demonstrates how macro research can frame possible scenarios without making recommendations.',
    'No position disclosure for this educational sample.',
    'Educational example only. Not financial advice.',
    true,
    true,
    '2026-01-08 14:30:00+00'
  )
on conflict (slug) do update
set
  title = excluded.title,
  ticker = excluded.ticker,
  asset_class = excluded.asset_class,
  bias = excluded.bias,
  status = excluded.status,
  visibility = excluded.visibility,
  timeframe = excluded.timeframe,
  setup_type = excluded.setup_type,
  entry_zone = excluded.entry_zone,
  invalidation_level = excluded.invalidation_level,
  target_1 = excluded.target_1,
  target_2 = excluded.target_2,
  target_3 = excluded.target_3,
  risk_level = excluded.risk_level,
  summary = excluded.summary,
  thesis = excluded.thesis,
  position_disclosure = excluded.position_disclosure,
  risk_disclosure = excluded.risk_disclosure,
  educational_purpose_only = excluded.educational_purpose_only,
  published = excluded.published,
  published_at = excluded.published_at;

insert into public.idea_tags (idea_id, tag_id)
values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111112'),
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111113'),
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111114'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111114'),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111113'),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111115'),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111111')
on conflict (idea_id, tag_id) do nothing;

insert into public.idea_updates (
  id,
  idea_id,
  title,
  body,
  status_after_update,
  created_at
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    '22222222-2222-4222-8222-222222222201',
    'Initial educational watch note',
    'Local sample update documenting how an idea can be reviewed without implying a trade instruction.',
    'watching',
    '2026-01-05 15:00:00+00'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '22222222-2222-4222-8222-222222222203',
    'Premium research preview update',
    'Local sample premium update showing how member-facing research history may be timestamped.',
    'watching',
    '2026-01-07 15:00:00+00'
  )
on conflict (id) do update
set
  idea_id = excluded.idea_id,
  title = excluded.title,
  body = excluded.body,
  status_after_update = excluded.status_after_update,
  created_at = excluded.created_at;

insert into public.idea_charts (
  id,
  idea_id,
  chart_type,
  symbol,
  tradingview_symbol,
  interval,
  caption
)
values
  (
    '44444444-4444-4444-8444-444444444401',
    '22222222-2222-4222-8222-222222222201',
    'tradingview_embed',
    'SPY',
    'SPY',
    'D',
    'TradingView-style metadata for a local educational SPY sample.'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '22222222-2222-4222-8222-222222222202',
    'tradingview_embed',
    'QQQ',
    'QQQ',
    'D',
    'TradingView-style metadata for a local educational QQQ sample.'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '22222222-2222-4222-8222-222222222203',
    'tradingview_embed',
    'NVDA',
    'NVDA',
    'D',
    'TradingView-style metadata for a local premium research preview.'
  )
on conflict (id) do update
set
  idea_id = excluded.idea_id,
  chart_type = excluded.chart_type,
  symbol = excluded.symbol,
  tradingview_symbol = excluded.tradingview_symbol,
  interval = excluded.interval,
  caption = excluded.caption;

insert into public.posts (
  id,
  title,
  slug,
  excerpt,
  body,
  visibility,
  published,
  published_at
)
values
  (
    '55555555-5555-4555-8555-555555555501',
    'Weekly Market Outlook',
    'weekly-market-outlook',
    'A public educational overview of market structure, rotation, volatility, and risk levels.',
    'This local sample demonstrates how a weekly market note can summarize scenarios for independent review. It is educational content only and not financial advice.',
    'free',
    true,
    '2026-01-09 14:30:00+00'
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    'Risk Management Lesson',
    'risk-management-lesson',
    'A premium educational lesson about defining invalidation before considering upside scenarios.',
    'This local sample explains risk-first research structure for educational review. It does not recommend any trade or guarantee any result.',
    'premium',
    true,
    '2026-01-10 14:30:00+00'
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    'Example Chart Breakdown',
    'example-chart-breakdown',
    'A pro-level educational sample showing thesis, invalidation, and alternate scenarios.',
    'This local sample demonstrates how a chart breakdown may be documented for research review. It is not a market recommendation.',
    'pro',
    true,
    '2026-01-11 14:30:00+00'
  )
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  visibility = excluded.visibility,
  published = excluded.published,
  published_at = excluded.published_at;
