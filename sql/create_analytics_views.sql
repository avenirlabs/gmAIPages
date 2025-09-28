-- Chat Analytics SQL Views and RPC Functions
-- Creates comprehensive analytics views for the Admin Chat Analytics module

-- 1) Daily overview (sessions, messages, products shown, latency, unique users, geo spread)
create or replace view public.v_chat_daily as
select
  date(m.created_at)                         as day,
  count(distinct m.conversation_id)          as sessions,
  count(m.id)                                as messages,
  coalesce(sum(m.products_count), 0)         as products_returned,
  round(avg(nullif(m.latency_ms,0))::numeric, 0) as avg_latency_ms,
  count(distinct nullif(m.user_id,''))       as unique_users,
  count(distinct m.country)                  as countries
from public.messages m
group by 1
order by 1 desc;

-- 2) Chip usage (explode text[] 'chips')
create or replace view public.v_chat_chip_usage as
with exploded as (
  select date(created_at) as day, unnest(coalesce(chips, '{}'))::text as chip
  from public.messages
)
select day, chip, count(*) as uses
from exploded
group by 1,2
order by day desc, uses desc;

-- 3) Filter usage (explode text[] 'filters')
create or replace view public.v_chat_filter_usage as
with exploded as (
  select date(created_at) as day, unnest(coalesce(filters, '{}'))::text as filter
  from public.messages
)
select day, filter, count(*) as uses
from exploded
group by 1,2
order by day desc, uses desc;

-- 4) Assistant performance (latency + reply length)
create or replace view public.v_chat_assistant_quality as
select
  date(created_at) as day,
  round(avg(nullif(latency_ms,0))::numeric, 0)  as avg_latency_ms,
  round(avg(length(coalesce(ai_reply,'')))::numeric, 0) as avg_reply_chars
from public.messages
where role = 'assistant'
group by 1
order by 1 desc;

-- 5) Products surface stats (per day)
create or replace view public.v_chat_products_surface as
select
  date(created_at)                       as day,
  round(avg(coalesce(products_count,0))::numeric, 1) as avg_products_per_msg,
  sum(coalesce(products_count,0))        as total_products
from public.messages
group by 1
order by 1 desc;

-- 6) Product impressions (top + daily)
create or replace view public.v_product_impressions_top as
select
  product_id,
  count(*)                                 as impressions,
  round(avg(coalesce(position,0))::numeric, 2) as avg_position,
  round(avg(coalesce(score,0))::numeric, 3)    as avg_score
from public.product_impressions
group by 1
order by impressions desc, avg_position asc
limit 100;

create or replace view public.v_product_impressions_daily as
select
  date(created_at)                         as day,
  count(*)                                 as impressions,
  round(avg(coalesce(position,0))::numeric, 2) as avg_position,
  round(avg(coalesce(score,0))::numeric, 3)    as avg_score
from public.product_impressions
group by 1
order by 1 desc;

-- 7) Geography (country/city distribution)
create or replace view public.v_chat_geo as
select
  coalesce(nullif(country,''), '(unknown)') as country,
  coalesce(nullif(city,''), '(unknown)')    as city,
  count(*)                                  as messages
from public.messages
group by 1,2
order by messages desc;

-- 8) Session depth (messages per conversation)
create or replace view public.v_chat_session_depth as
select
  conversation_id,
  count(*) as messages_in_session,
  min(created_at) as started_at,
  max(created_at) as last_msg_at
from public.messages
group by conversation_id
order by messages_in_session desc, started_at desc;

-- 9) RPC for date-bounded KPIs used by the main chart/table
create or replace function public.get_chat_kpis(
  p_start date,
  p_end   date
)
returns table(
  day date,
  sessions bigint,
  messages bigint,
  products_returned bigint,
  avg_latency_ms double precision,
  unique_users bigint,
  countries bigint
)
language sql
as $$
  select
    date(m.created_at)                         as day,
    count(distinct m.conversation_id)          as sessions,
    count(m.id)                                as messages,
    coalesce(sum(m.products_count), 0)         as products_returned,
    avg(nullif(m.latency_ms,0))                as avg_latency_ms,
    count(distinct nullif(m.user_id,''))       as unique_users,
    count(distinct m.country)                  as countries
  from public.messages m
  where m.created_at >= p_start
    and m.created_at < (p_end + 1)
  group by 1
  order by 1;
$$;