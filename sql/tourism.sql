-- ============================================================================
-- Map My Biz — tourism space schema
-- Run this in the Supabase SQL editor (or via psql) to switch the tourism page
-- from its bundled seed listings to real, bookable experiences.
--
-- Tables added:
--   tourism_experiences    - bookable rural experiences (guesthouses, tours,
--                            craft workshops, safaris, retreats)
--   newsletter_subscribers - weekly digest signups from the tourism page
--
-- Everything is IF NOT EXISTS, so it is safe to re-run. The app already falls
-- back to `src/data/tourism.js` when these tables are empty or missing.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tourism experiences
-- ---------------------------------------------------------------------------
create table if not exists public.tourism_experiences (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid,
  name            text not null,
  host            text,
  province        text,
  town            text,
  location        text,
  category        text not null default 'tourism',
  activity        text not null default 'culture'
                    check (activity in ('culture', 'wildlife', 'adventure', 'food',
                                        'craft', 'wellness', 'stay')),
  price           numeric(10, 2) not null default 0,
  price_unit      text not null default 'per person',
  duration_hours  numeric(6, 1) not null default 0,
  group_size_max  integer not null default 0,
  rating          numeric(2, 1) not null default 0,
  reviews_count   integer not null default 0,
  review_snippet  text,
  review_author   text,
  image_url       text,
  images          text[],
  -- pipe-separated list, e.g. 'Guided tour|Lunch|Transport'
  included        text,
  availability    text,
  transport       text,
  cell_coverage   text,
  safety          text,
  latitude        numeric(10, 7),
  longitude       numeric(10, 7),
  phone           text,
  whatsapp        text,
  email           text,
  is_youth_owned  boolean not null default false,
  verified        boolean not null default false,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tourism_experiences_status_idx
  on public.tourism_experiences (status);
create index if not exists tourism_experiences_province_idx
  on public.tourism_experiences (province);
create index if not exists tourism_experiences_activity_idx
  on public.tourism_experiences (activity);
create index if not exists tourism_experiences_business_idx
  on public.tourism_experiences (business_id);

-- ---------------------------------------------------------------------------
-- 2. Newsletter subscribers
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text not null default 'tourism_page',
  created_at  timestamptz not null default now()
);

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Row level security
--    Experiences are public once approved, writable by their owner or an admin.
--    Anyone (including anonymous travellers) can sign up for the digest, but
--    only admins can read or remove the list.
-- ---------------------------------------------------------------------------
alter table public.tourism_experiences    enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Reuse the admin check from dashboards.sql when it is already installed.
do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'is_platform_admin'
  ) then
    execute $fn$
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
    $fn$;
  end if;
end;
$$;

-- Travellers can browse approved experiences without signing in.
drop policy if exists tourism_experiences_public_read on public.tourism_experiences;
create policy tourism_experiences_public_read on public.tourism_experiences
  for select
  using (status = 'approved' or auth.uid() is not null or public.is_platform_admin());

-- The owner of the linked business, or an admin, can edit listings.
drop policy if exists tourism_experiences_owner_write on public.tourism_experiences;
create policy tourism_experiences_owner_write on public.tourism_experiences
  for all
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

-- Public signups, admin-only reads and deletes.
drop policy if exists newsletter_public_insert on public.newsletter_subscribers;
create policy newsletter_public_insert on public.newsletter_subscribers
  for insert
  with check (true);

drop policy if exists newsletter_admin_all on public.newsletter_subscribers;
create policy newsletter_admin_all on public.newsletter_subscribers
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 4. Auto-update timestamps
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

drop trigger if exists tourism_experiences_touch on public.tourism_experiences;
create trigger tourism_experiences_touch
  before update on public.tourism_experiences
  for each row execute function public.touch_updated_at();
