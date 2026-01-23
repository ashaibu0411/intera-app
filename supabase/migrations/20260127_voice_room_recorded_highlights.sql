-- Voice Rooms: recorded highlights -> Clips pipeline (LiveKit Egress)

create extension if not exists pgcrypto;

-- Track highlight recordings (each highlight becomes a clip file in Storage)
create table if not exists public.voice_room_highlights (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.voice_rooms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  label text not null default '',
  egress_id text not null,
  storage_bucket text not null default 'clips',
  storage_path text not null, -- object path inside bucket (e.g. "voice_rooms/<roomId>/highlight_<time>.mp4")
  clip_id uuid null references public.clips(id) on delete set null,
  status text not null default 'recording' check (status in ('recording', 'stopped', 'ready', 'failed')),
  started_at timestamptz not null default now(),
  stopped_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists voice_room_highlights_room_id_idx on public.voice_room_highlights(room_id);
create index if not exists voice_room_highlights_created_by_idx on public.voice_room_highlights(created_by);
create index if not exists voice_room_highlights_clip_id_idx on public.voice_room_highlights(clip_id);
create index if not exists voice_room_highlights_created_at_idx on public.voice_room_highlights(created_at desc);

alter table public.voice_room_highlights enable row level security;

-- Read: public can read if the linked clip exists (published via Clips); otherwise only host/mod/creator.
drop policy if exists "voice_room_highlights_select" on public.voice_room_highlights;
create policy "voice_room_highlights_select"
on public.voice_room_highlights
for select
using (
  clip_id is not null
  or exists (select 1 from public.voice_rooms r where r.id = voice_room_highlights.room_id and r.creator_id = auth.uid())
  or exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_highlights.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
);

-- Insert: authenticated users can insert highlights as themselves (UI restricts to hosts).
drop policy if exists "voice_room_highlights_insert_self" on public.voice_room_highlights;
create policy "voice_room_highlights_insert_self"
on public.voice_room_highlights
for insert
to authenticated
with check (created_by = auth.uid());

-- Update: creator/host/mod can update status/clip_id.
drop policy if exists "voice_room_highlights_update_host_mod" on public.voice_room_highlights;
create policy "voice_room_highlights_update_host_mod"
on public.voice_room_highlights
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (select 1 from public.voice_rooms r where r.id = voice_room_highlights.room_id and r.creator_id = auth.uid())
  or exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_highlights.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
)
with check (true);

