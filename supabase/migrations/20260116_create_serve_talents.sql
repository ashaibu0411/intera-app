-- Serve & Connect: volunteer/talent profiles (Supabase-backed)
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Helper for updated_at + last_active timestamps (safe to re-run)
create or replace function public.trigger_set_timestamp_and_last_active()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.last_active = now();
  return new;
end;
$$;

create table if not exists public.serve_talents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  category text not null,
  skills text[] not null default '{}'::text[],
  experience text not null default '',
  bio text not null,

  is_available boolean not null default true,
  availability_note text null,

  willing_to_travel boolean not null default false,
  travel_radius text null,

  faith_background text null,

  contact_phone text null,
  contact_email text null,

  portfolio_images text[] not null default '{}'::text[],
  video_link text null,

  -- Location
  country text not null,
  admin_area text null,
  city text not null,
  neighborhood text null,
  location_label text not null,

  -- Reach: 'neighborhood' | 'city' | 'global'
  scope text not null default 'city' check (scope in ('neighborhood', 'city', 'global')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active timestamptz not null default now(),

  unique(user_id)
);

drop trigger if exists set_timestamp_serve_talents on public.serve_talents;
create trigger set_timestamp_serve_talents
before update on public.serve_talents
for each row
execute function public.trigger_set_timestamp_and_last_active();

create index if not exists serve_talents_city_idx on public.serve_talents(city);
create index if not exists serve_talents_neighborhood_idx on public.serve_talents(neighborhood);
create index if not exists serve_talents_category_idx on public.serve_talents(category);
create index if not exists serve_talents_created_at_idx on public.serve_talents(created_at desc);

alter table public.serve_talents enable row level security;

drop policy if exists "serve_talents_select_all" on public.serve_talents;
create policy "serve_talents_select_all"
  on public.serve_talents
  for select
  to authenticated
  using (true);

drop policy if exists "serve_talents_insert_own" on public.serve_talents;
create policy "serve_talents_insert_own"
  on public.serve_talents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "serve_talents_update_own" on public.serve_talents;
create policy "serve_talents_update_own"
  on public.serve_talents
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "serve_talents_delete_own" on public.serve_talents;
create policy "serve_talents_delete_own"
  on public.serve_talents
  for delete
  to authenticated
  using (auth.uid() = user_id);

