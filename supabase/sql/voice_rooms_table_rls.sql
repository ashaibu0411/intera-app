-- Fix: allow creating/listing voice rooms under RLS
-- Run this in Supabase SQL Editor (Production DB).

-- Enable RLS (safe if already enabled)
alter table if exists public.voice_rooms enable row level security;

-- Drop old policies (if any)
drop policy if exists "voice_rooms_select_all" on public.voice_rooms;
drop policy if exists "voice_rooms_insert_own" on public.voice_rooms;
drop policy if exists "voice_rooms_update_own" on public.voice_rooms;
drop policy if exists "voice_rooms_delete_own" on public.voice_rooms;

-- Allow app to list/view rooms (signed-in and guests)
create policy "voice_rooms_select_all"
on public.voice_rooms
for select
to public
using (true);

-- Only authenticated users can create rooms, and they must be the creator
create policy "voice_rooms_insert_own"
on public.voice_rooms
for insert
to authenticated
with check (auth.uid() = creator_id);

-- Only the creator can update their room (end/reopen/edit)
create policy "voice_rooms_update_own"
on public.voice_rooms
for update
to authenticated
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

-- Only the creator can delete their room
create policy "voice_rooms_delete_own"
on public.voice_rooms
for delete
to authenticated
using (auth.uid() = creator_id);

