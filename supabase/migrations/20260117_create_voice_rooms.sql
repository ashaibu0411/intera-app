-- Voice Rooms (real live audio rooms + roles + raise-hand)
-- Requires a LiveKit (or similar) SFU for actual audio streaming; this schema stores room metadata and role state.

-- Helper trigger to keep updated_at fresh
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Room metadata (persistent)
create table if not exists public.voice_rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text null,
  topic text null,
  -- Location targeting (optional, to match the rest of the app)
  country text not null default '',
  admin_area text null,
  city text not null default '',
  neighborhood text null,
  scope text not null default 'global' check (scope in ('neighborhood', 'city', 'global')),

  status text not null default 'live' check (status in ('scheduled', 'live', 'ended')),
  starts_at timestamptz null,
  ended_at timestamptz null,

  -- Backing SFU room identifier
  provider text not null default 'livekit',
  provider_room_name text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp on public.voice_rooms;
create trigger set_timestamp
before update on public.voice_rooms
for each row execute function public.trigger_set_timestamp();

-- Participants (ephemeral-ish; we keep last_seen for online presence)
create table if not exists public.voice_room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.voice_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'listener' check (role in ('host', 'moderator', 'speaker', 'listener')),
  is_muted boolean not null default false,
  hand_raised boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (room_id, user_id)
);

-- Raised hands queue (optional helper; redundant with participants.hand_raised but useful for ordering)
create table if not exists public.voice_room_hand_raises (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.voice_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (room_id, user_id)
);

-- RLS
alter table public.voice_rooms enable row level security;
alter table public.voice_room_participants enable row level security;
alter table public.voice_room_hand_raises enable row level security;

-- voice_rooms policies
drop policy if exists "voice_rooms_read_public" on public.voice_rooms;
create policy "voice_rooms_read_public"
on public.voice_rooms
for select
using (true);

drop policy if exists "voice_rooms_insert_own" on public.voice_rooms;
create policy "voice_rooms_insert_own"
on public.voice_rooms
for insert
to authenticated
with check (auth.uid() = creator_id);

drop policy if exists "voice_rooms_update_creator" on public.voice_rooms;
create policy "voice_rooms_update_creator"
on public.voice_rooms
for update
to authenticated
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

drop policy if exists "voice_rooms_delete_creator" on public.voice_rooms;
create policy "voice_rooms_delete_creator"
on public.voice_rooms
for delete
to authenticated
using (auth.uid() = creator_id);

-- participants policies
drop policy if exists "voice_room_participants_read_public" on public.voice_room_participants;
create policy "voice_room_participants_read_public"
on public.voice_room_participants
for select
using (true);

drop policy if exists "voice_room_participants_insert_self" on public.voice_room_participants;
create policy "voice_room_participants_insert_self"
on public.voice_room_participants
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "voice_room_participants_update_self" on public.voice_room_participants;
create policy "voice_room_participants_update_self"
on public.voice_room_participants
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- host/moderator can update roles & mute
drop policy if exists "voice_room_participants_update_host_mod" on public.voice_room_participants;
create policy "voice_room_participants_update_host_mod"
on public.voice_room_participants
for update
to authenticated
using (
  exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_participants.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
)
with check (true);

drop policy if exists "voice_room_participants_delete_self" on public.voice_room_participants;
create policy "voice_room_participants_delete_self"
on public.voice_room_participants
for delete
to authenticated
using (auth.uid() = user_id);

-- hand raises policies
drop policy if exists "voice_room_hand_raises_read_public" on public.voice_room_hand_raises;
create policy "voice_room_hand_raises_read_public"
on public.voice_room_hand_raises
for select
using (true);

drop policy if exists "voice_room_hand_raises_insert_self" on public.voice_room_hand_raises;
create policy "voice_room_hand_raises_insert_self"
on public.voice_room_hand_raises
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "voice_room_hand_raises_delete_self_or_host" on public.voice_room_hand_raises;
create policy "voice_room_hand_raises_delete_self_or_host"
on public.voice_room_hand_raises
for delete
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_hand_raises.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
);

