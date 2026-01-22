-- Voice Rooms: context panel + silent participation + recap storage

create extension if not exists pgcrypto;

-- =========================
-- 1) Context fields on rooms
-- =========================
alter table public.voice_rooms
  add column if not exists pinned_title text null,
  add column if not exists pinned_route text null,
  add column if not exists rules text null,
  add column if not exists resources text[] not null default '{}'::text[],
  add column if not exists require_speaker_approval boolean not null default true,
  add column if not exists record_highlights boolean not null default false;

-- =========================
-- 2) Silent participation: reactions
-- =========================
create table if not exists public.voice_room_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.voice_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('agree', 'heart', 'clap', 'fire')),
  created_at timestamptz not null default now()
);

create index if not exists voice_room_reactions_room_id_idx on public.voice_room_reactions (room_id);
create index if not exists voice_room_reactions_kind_idx on public.voice_room_reactions (kind);
create index if not exists voice_room_reactions_created_at_idx on public.voice_room_reactions (created_at desc);

alter table public.voice_room_reactions enable row level security;

drop policy if exists "voice_room_reactions_read_public" on public.voice_room_reactions;
create policy "voice_room_reactions_read_public"
on public.voice_room_reactions
for select
using (true);

drop policy if exists "voice_room_reactions_insert_self" on public.voice_room_reactions;
create policy "voice_room_reactions_insert_self"
on public.voice_room_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "voice_room_reactions_delete_self" on public.voice_room_reactions;
create policy "voice_room_reactions_delete_self"
on public.voice_room_reactions
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================
-- 3) Silent participation: notes-to-host
-- =========================
create table if not exists public.voice_room_notes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.voice_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists voice_room_notes_room_id_idx on public.voice_room_notes (room_id);
create index if not exists voice_room_notes_created_at_idx on public.voice_room_notes (created_at desc);

alter table public.voice_room_notes enable row level security;

-- Only host/mod can read notes.
drop policy if exists "voice_room_notes_read_host_mod" on public.voice_room_notes;
create policy "voice_room_notes_read_host_mod"
on public.voice_room_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_notes.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_notes.room_id
      and r.creator_id = auth.uid()
  )
);

-- Anyone authenticated can send a note as themselves.
drop policy if exists "voice_room_notes_insert_self" on public.voice_room_notes;
create policy "voice_room_notes_insert_self"
on public.voice_room_notes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "voice_room_notes_delete_self" on public.voice_room_notes;
create policy "voice_room_notes_delete_self"
on public.voice_room_notes
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================
-- 4) Room recap storage ("community memory" MVP)
-- =========================
create table if not exists public.voice_room_recaps (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.voice_rooms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  summary text not null default '',
  highlights text[] not null default '{}'::text[],
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id)
);

create index if not exists voice_room_recaps_room_id_idx on public.voice_room_recaps (room_id);
create index if not exists voice_room_recaps_published_idx on public.voice_room_recaps (published);

alter table public.voice_room_recaps enable row level security;

drop policy if exists "voice_room_recaps_select_public_or_host" on public.voice_room_recaps;
create policy "voice_room_recaps_select_public_or_host"
on public.voice_room_recaps
for select
using (
  published = true
  or created_by = auth.uid()
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_recaps.room_id
      and r.creator_id = auth.uid()
  )
  or exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_recaps.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
);

drop policy if exists "voice_room_recaps_insert_host_mod" on public.voice_room_recaps;
create policy "voice_room_recaps_insert_host_mod"
on public.voice_room_recaps
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    exists (select 1 from public.voice_rooms r where r.id = voice_room_recaps.room_id and r.creator_id = auth.uid())
    or exists (
      select 1
      from public.voice_room_participants me
      where me.room_id = voice_room_recaps.room_id
        and me.user_id = auth.uid()
        and me.role in ('host', 'moderator')
    )
  )
);

drop policy if exists "voice_room_recaps_update_host_mod" on public.voice_room_recaps;
create policy "voice_room_recaps_update_host_mod"
on public.voice_room_recaps
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (select 1 from public.voice_rooms r where r.id = voice_room_recaps.room_id and r.creator_id = auth.uid())
  or exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_recaps.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
)
with check (true);

-- updated_at trigger
create or replace function public.touch_voice_room_recaps_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_voice_room_recaps_updated_at on public.voice_room_recaps;
create trigger trg_touch_voice_room_recaps_updated_at
before update on public.voice_room_recaps
for each row
execute procedure public.touch_voice_room_recaps_updated_at();

