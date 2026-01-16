-- Create general Events tables (non-faith) with reach + RSVP support
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

-- ====================
-- EVENTS
-- ====================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  date timestamptz not null,
  time text not null,
  end_time text null,
  location text not null,
  address text not null,
  image text null,
  category text not null,
  is_public boolean not null default true,
  scope text not null default 'city' check (scope in ('city', 'nearby', 'global')),
  created_at timestamptz not null default now()
);

create index if not exists events_date_idx on public.events(date);
create index if not exists events_location_idx on public.events(location);
create index if not exists events_scope_idx on public.events(scope);
create index if not exists events_creator_idx on public.events(creator_id);

alter table public.events enable row level security;

-- Public events are readable by everyone; creators can read their private events.
drop policy if exists "events_select_public_or_creator" on public.events;
create policy "events_select_public_or_creator"
  on public.events
  for select
  using (is_public = true or creator_id = auth.uid());

-- Only authenticated users can create events as themselves.
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own"
  on public.events
  for insert
  with check (creator_id = auth.uid());

-- Only creators can update/delete their events.
drop policy if exists "events_update_own" on public.events;
create policy "events_update_own"
  on public.events
  for update
  using (creator_id = auth.uid());

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own"
  on public.events
  for delete
  using (creator_id = auth.uid());

-- ====================
-- EVENT RSVPS
-- ====================
create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('interested', 'going')),
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create index if not exists event_rsvps_event_id_idx on public.event_rsvps(event_id);
create index if not exists event_rsvps_user_id_idx on public.event_rsvps(user_id);

alter table public.event_rsvps enable row level security;

-- Users can read their own RSVPs.
drop policy if exists "event_rsvps_select_own" on public.event_rsvps;
create policy "event_rsvps_select_own"
  on public.event_rsvps
  for select
  using (user_id = auth.uid());

-- Users can create/update/delete their own RSVPs.
drop policy if exists "event_rsvps_insert_own" on public.event_rsvps;
create policy "event_rsvps_insert_own"
  on public.event_rsvps
  for insert
  with check (user_id = auth.uid());

drop policy if exists "event_rsvps_update_own" on public.event_rsvps;
create policy "event_rsvps_update_own"
  on public.event_rsvps
  for update
  using (user_id = auth.uid());

drop policy if exists "event_rsvps_delete_own" on public.event_rsvps;
create policy "event_rsvps_delete_own"
  on public.event_rsvps
  for delete
  using (user_id = auth.uid());

