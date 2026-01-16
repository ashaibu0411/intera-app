-- Individual service providers (house helps, cooks, plumbers, etc) + trust layer
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Helper for updated_at timestamps (safe to re-run)
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ====================
-- SERVICE PROVIDERS (profiles)
-- ====================
create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Category examples: 'house_help', 'cook', 'nanny', 'cleaner', 'tutor', 'plumber', 'electrician', 'carpenter', 'mechanic', 'hairdresser', 'tailor', 'other'
  category text not null,
  title text not null, -- e.g. "House Help", "Private Cook"
  bio text not null,
  skills text[] not null default '{}'::text[],

  is_available boolean not null default true,
  availability_note text null,

  contact_phone text null,
  contact_email text null,

  -- Location
  country text not null,
  admin_area text null,
  city text not null,
  neighborhood text null,
  location_label text not null, -- e.g. "Aurora, CO · Southshore"

  -- Reach: 'neighborhood' | 'city' | 'global'
  scope text not null default 'city' check (scope in ('neighborhood', 'city', 'global')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

drop trigger if exists set_timestamp_service_providers on public.service_providers;
create trigger set_timestamp_service_providers
before update on public.service_providers
for each row
execute function public.trigger_set_timestamp();

create index if not exists service_providers_city_idx on public.service_providers(city);
create index if not exists service_providers_neighborhood_idx on public.service_providers(neighborhood);
create index if not exists service_providers_category_idx on public.service_providers(category);
create index if not exists service_providers_created_at_idx on public.service_providers(created_at desc);

alter table public.service_providers enable row level security;

drop policy if exists "service_providers_select_all" on public.service_providers;
create policy "service_providers_select_all"
  on public.service_providers
  for select
  to authenticated
  using (true);

drop policy if exists "service_providers_upsert_own" on public.service_providers;
create policy "service_providers_upsert_own"
  on public.service_providers
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ====================
-- PROVIDER REVIEWS (by homeowners/community)
-- ====================
create table if not exists public.service_provider_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, reviewer_id)
);

drop trigger if exists set_timestamp_service_provider_reviews on public.service_provider_reviews;
create trigger set_timestamp_service_provider_reviews
before update on public.service_provider_reviews
for each row
execute function public.trigger_set_timestamp();

create index if not exists service_provider_reviews_provider_idx on public.service_provider_reviews(provider_id);

alter table public.service_provider_reviews enable row level security;

drop policy if exists "service_provider_reviews_select_all" on public.service_provider_reviews;
create policy "service_provider_reviews_select_all"
  on public.service_provider_reviews
  for select
  to authenticated
  using (true);

drop policy if exists "service_provider_reviews_insert_own" on public.service_provider_reviews;
create policy "service_provider_reviews_insert_own"
  on public.service_provider_reviews
  for insert
  to authenticated
  with check (reviewer_id = auth.uid());

drop policy if exists "service_provider_reviews_update_own" on public.service_provider_reviews;
create policy "service_provider_reviews_update_own"
  on public.service_provider_reviews
  for update
  to authenticated
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "service_provider_reviews_delete_own" on public.service_provider_reviews;
create policy "service_provider_reviews_delete_own"
  on public.service_provider_reviews
  for delete
  to authenticated
  using (reviewer_id = auth.uid());

-- ====================
-- "WORKED FOR ME" CONFIRMATIONS
-- ====================
create table if not exists public.service_provider_confirmations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(provider_id, user_id)
);

create index if not exists service_provider_confirmations_provider_idx on public.service_provider_confirmations(provider_id);

alter table public.service_provider_confirmations enable row level security;

drop policy if exists "service_provider_confirmations_select_all" on public.service_provider_confirmations;
create policy "service_provider_confirmations_select_all"
  on public.service_provider_confirmations
  for select
  to authenticated
  using (true);

drop policy if exists "service_provider_confirmations_insert_own" on public.service_provider_confirmations;
create policy "service_provider_confirmations_insert_own"
  on public.service_provider_confirmations
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "service_provider_confirmations_delete_own" on public.service_provider_confirmations;
create policy "service_provider_confirmations_delete_own"
  on public.service_provider_confirmations
  for delete
  to authenticated
  using (user_id = auth.uid());

