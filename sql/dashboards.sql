-- ============================================================================
-- Map My Biz — dashboards schema
-- Run this in the Supabase SQL editor (or via psql) BEFORE using the new
-- user dashboard / admin dashboard features.
--
-- Tables added:
--   subscriptions     - which plan a user is on (drives the dynamic dashboard)
--   business_metrics  - monthly revenue / costs / customers for growth tracking
--   certificates      - certificates earned from completed learning tracks
--   promotions        - admin marketing campaigns
--
-- Everything is IF NOT EXISTS, so it is safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users (id) on delete cascade,
  plan_id         text not null default 'free'
                    check (plan_id in ('free', 'pro', 'premium')),
  status          text not null default 'none'
                    check (status in ('none', 'active', 'past_due', 'cancelled', 'expired')),
  started_at      timestamptz,
  renews_at       timestamptz,
  cancelled_at    timestamptz,
  payment_method  text,
  reference       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists subscriptions_plan_idx on public.subscriptions (plan_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

-- ---------------------------------------------------------------------------
-- 2. Business metrics (monthly growth numbers)
-- ---------------------------------------------------------------------------
create table if not exists public.business_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  business_id uuid,
  month       date not null,
  revenue     numeric(12, 2) not null default 0,
  expenses    numeric(12, 2) not null default 0,
  customers   integer not null default 0,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists business_metrics_user_month_idx
  on public.business_metrics (user_id, month);

-- ---------------------------------------------------------------------------
-- 3. Certificates
-- ---------------------------------------------------------------------------
create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  track_id    text not null,
  name        text,
  reference   text not null unique,
  issued_at   timestamptz not null default now(),
  revoked     boolean not null default false,
  revoked_at  timestamptz
);

create index if not exists certificates_user_idx on public.certificates (user_id);
create index if not exists certificates_track_idx on public.certificates (track_id);

-- ---------------------------------------------------------------------------
-- 4. Promotions (admin campaigns)
-- ---------------------------------------------------------------------------
create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  channel      text not null default 'platform',
  discount_pct numeric(5, 2) not null default 0,
  code         text,
  starts_at    date,
  ends_at      date,
  audience     text not null default 'all',
  active       boolean not null default true,
  clicks       integer not null default 0,
  signups      integer not null default 0,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists promotions_active_idx on public.promotions (active);

-- ---------------------------------------------------------------------------
-- 5. Row level security
--    Users read/write their own rows; admins (emails listed below) see all.
-- ---------------------------------------------------------------------------
alter table public.subscriptions    enable row level security;
alter table public.business_metrics enable row level security;
alter table public.certificates     enable row level security;
alter table public.promotions       enable row level security;

-- Replace this list with your real admin emails.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array['admin@mapmybizz.co.za']
  );
$$;

drop policy if exists subscriptions_own on public.subscriptions;
create policy subscriptions_own on public.subscriptions
  for all
  using (auth.uid() = user_id or public.is_platform_admin())
  with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists business_metrics_own on public.business_metrics;
create policy business_metrics_own on public.business_metrics
  for all
  using (auth.uid() = user_id or public.is_platform_admin())
  with check (auth.uid() = user_id or public.is_platform_admin());

drop policy if exists certificates_own on public.certificates;
create policy certificates_own on public.certificates
  for all
  using (auth.uid() = user_id or public.is_platform_admin())
  with check (auth.uid() = user_id or public.is_platform_admin());

-- Anyone signed in can read active campaigns; only admins can change them.
drop policy if exists promotions_read on public.promotions;
create policy promotions_read on public.promotions
  for select
  using (auth.uid() is not null);

drop policy if exists promotions_admin_write on public.promotions;
create policy promotions_admin_write on public.promotions
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 6. Auto-update timestamps
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

drop trigger if exists business_metrics_touch on public.business_metrics;
create trigger business_metrics_touch
  before update on public.business_metrics
  for each row execute function public.touch_updated_at();
