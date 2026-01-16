-- Housing listings + trust signals (confirmations + flags)
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

-- ====================
-- HOUSING LISTINGS
-- ====================
create table if not exists public.housing_listings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,

  type text not null check (type in ('room', 'apartment', 'house', 'sublet')),
  title text not null,
  description text not null,

  price numeric not null,
  currency text not null default 'USD',
  price_type text not null default 'month' check (price_type in ('month', 'week', 'day')),

  bedrooms int not null default 0,
  bathrooms int not null default 0,
  is_furnished boolean not null default false,
  utilities_included boolean not null default false,
  pet_friendly boolean not null default false,

  images text[] not null default '{}'::text[],

  -- Location
  country text not null,
  admin_area text null,
  city text not null,
  neighborhood text null,
  location_label text not null, -- e.g. "Aurora, CO · Southshore"
  address text null,

  -- Reach: 'neighborhood' | 'city' | 'global'
  scope text not null default 'city' check (scope in ('neighborhood', 'city', 'global')),

  created_at timestamptz not null default now()
);

create index if not exists housing_listings_created_at_idx on public.housing_listings(created_at desc);
create index if not exists housing_listings_city_idx on public.housing_listings(city);
create index if not exists housing_listings_neighborhood_idx on public.housing_listings(neighborhood);
create index if not exists housing_listings_scope_idx on public.housing_listings(scope);
create index if not exists housing_listings_creator_idx on public.housing_listings(creator_id);

alter table public.housing_listings enable row level security;

drop policy if exists "housing_listings_select_all" on public.housing_listings;
create policy "housing_listings_select_all"
  on public.housing_listings
  for select
  to authenticated
  using (true);

drop policy if exists "housing_listings_insert_own" on public.housing_listings;
create policy "housing_listings_insert_own"
  on public.housing_listings
  for insert
  to authenticated
  with check (creator_id = auth.uid());

drop policy if exists "housing_listings_update_own" on public.housing_listings;
create policy "housing_listings_update_own"
  on public.housing_listings
  for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

drop policy if exists "housing_listings_delete_own" on public.housing_listings;
create policy "housing_listings_delete_own"
  on public.housing_listings
  for delete
  to authenticated
  using (creator_id = auth.uid());

-- ====================
-- CONFIRMATIONS ("seen by neighbor")
-- ====================
create table if not exists public.housing_listing_confirmations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.housing_listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, user_id)
);

create index if not exists housing_listing_confirmations_listing_idx on public.housing_listing_confirmations(listing_id);

alter table public.housing_listing_confirmations enable row level security;

drop policy if exists "housing_listing_confirmations_select_all" on public.housing_listing_confirmations;
create policy "housing_listing_confirmations_select_all"
  on public.housing_listing_confirmations
  for select
  to authenticated
  using (true);

drop policy if exists "housing_listing_confirmations_insert_own" on public.housing_listing_confirmations;
create policy "housing_listing_confirmations_insert_own"
  on public.housing_listing_confirmations
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "housing_listing_confirmations_delete_own" on public.housing_listing_confirmations;
create policy "housing_listing_confirmations_delete_own"
  on public.housing_listing_confirmations
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ====================
-- FLAGS (suspicious)
-- ====================
create table if not exists public.housing_listing_flags (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.housing_listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'suspicious',
  note text null,
  created_at timestamptz not null default now(),
  unique(listing_id, user_id)
);

create index if not exists housing_listing_flags_listing_idx on public.housing_listing_flags(listing_id);

alter table public.housing_listing_flags enable row level security;

drop policy if exists "housing_listing_flags_select_all" on public.housing_listing_flags;
create policy "housing_listing_flags_select_all"
  on public.housing_listing_flags
  for select
  to authenticated
  using (true);

drop policy if exists "housing_listing_flags_insert_own" on public.housing_listing_flags;
create policy "housing_listing_flags_insert_own"
  on public.housing_listing_flags
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "housing_listing_flags_delete_own" on public.housing_listing_flags;
create policy "housing_listing_flags_delete_own"
  on public.housing_listing_flags
  for delete
  to authenticated
  using (user_id = auth.uid());

