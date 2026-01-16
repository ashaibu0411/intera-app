-- Service providers trust layer: reviews + "worked for me" confirmations
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
-- BUSINESS REVIEWS
-- ====================
create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, reviewer_id)
);

create index if not exists business_reviews_business_idx on public.business_reviews(business_id);

alter table public.business_reviews enable row level security;

drop policy if exists "business_reviews_select_all" on public.business_reviews;
create policy "business_reviews_select_all"
  on public.business_reviews
  for select
  to authenticated
  using (true);

drop policy if exists "business_reviews_insert_own" on public.business_reviews;
create policy "business_reviews_insert_own"
  on public.business_reviews
  for insert
  to authenticated
  with check (reviewer_id = auth.uid());

drop policy if exists "business_reviews_update_own" on public.business_reviews;
create policy "business_reviews_update_own"
  on public.business_reviews
  for update
  to authenticated
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "business_reviews_delete_own" on public.business_reviews;
create policy "business_reviews_delete_own"
  on public.business_reviews
  for delete
  to authenticated
  using (reviewer_id = auth.uid());

-- Update updated_at on changes
drop trigger if exists set_timestamp_business_reviews on public.business_reviews;
create trigger set_timestamp_business_reviews
before update on public.business_reviews
for each row
execute function public.trigger_set_timestamp();

-- ====================
-- "WORKED FOR ME" CONFIRMATIONS
-- ====================
create table if not exists public.business_confirmations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(business_id, user_id)
);

create index if not exists business_confirmations_business_idx on public.business_confirmations(business_id);

alter table public.business_confirmations enable row level security;

drop policy if exists "business_confirmations_select_all" on public.business_confirmations;
create policy "business_confirmations_select_all"
  on public.business_confirmations
  for select
  to authenticated
  using (true);

drop policy if exists "business_confirmations_insert_own" on public.business_confirmations;
create policy "business_confirmations_insert_own"
  on public.business_confirmations
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "business_confirmations_delete_own" on public.business_confirmations;
create policy "business_confirmations_delete_own"
  on public.business_confirmations
  for delete
  to authenticated
  using (user_id = auth.uid());

