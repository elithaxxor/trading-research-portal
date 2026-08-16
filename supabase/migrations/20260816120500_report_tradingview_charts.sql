-- Add opt-in TradingView chart configuration to research posts.
-- Chart metadata follows the parent post's existing RLS visibility rules.

alter table public.posts
  add column if not exists chart_enabled boolean not null default false,
  add column if not exists tradingview_symbol text,
  add column if not exists chart_interval text not null default 'D',
  add column if not exists chart_caption text,
  add column if not exists chart_studies text[] not null
    default array['STD;EMA', 'STD;RSI']::text[];

alter table public.posts
  alter column chart_studies set default array['STD;EMA', 'STD;RSI']::text[];

alter table public.posts
  drop constraint if exists posts_chart_interval_check,
  add constraint posts_chart_interval_check
    check (chart_interval in ('1', '3', '5', '15', '30', '60', '120', '240', 'D', 'W', 'M')),
  drop constraint if exists posts_tradingview_symbol_check,
  add constraint posts_tradingview_symbol_check
    check (
      tradingview_symbol is null
      or (
        char_length(tradingview_symbol) between 1 and 64
        and tradingview_symbol ~ '^[A-Z0-9_:.!/-]+$'
      )
    ),
  drop constraint if exists posts_chart_caption_check,
  add constraint posts_chart_caption_check
    check (chart_caption is null or char_length(chart_caption) <= 300),
  drop constraint if exists posts_chart_enabled_symbol_check,
  add constraint posts_chart_enabled_symbol_check
    check (not chart_enabled or tradingview_symbol is not null),
  drop constraint if exists posts_chart_studies_check,
  add constraint posts_chart_studies_check
    check (
      chart_studies <@ array[
        'STD;SMA',
        'STD;EMA',
        'STD;RSI',
        'STD;MACD'
      ]::text[]
    );

comment on column public.posts.chart_enabled is
  'Enables the validated TradingView chart on the full-access research page.';
comment on column public.posts.tradingview_symbol is
  'Validated public market symbol only. Do not store private content or scripts.';
comment on column public.posts.chart_studies is
  'Allowlisted standard TradingView indicators. Private Pine Script is not accepted.';
