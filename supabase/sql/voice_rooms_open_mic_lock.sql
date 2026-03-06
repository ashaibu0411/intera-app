-- Voice Rooms "Zoom-style Clubhouse" settings
-- - Host can mute/unmute self
-- - Everyone joins as audience/listener
-- - Audience can freely unmute to speak
-- - Host can mute + lock someone (prevents self-unmute)
-- - No recursive RLS policies

-- Cleanup any previous experimental triggers/functions (safe if missing)
drop trigger if exists trg_voice_room_force_open_mic on public.voice_room_participants;
drop trigger if exists trg_voice_room_participants_open_mic_lock on public.voice_room_participants;
drop trigger if exists trg_voice_room_participants_open_mic_lock_v2 on public.voice_room_participants;
drop trigger if exists trg_voice_room_mute_lock on public.voice_room_participants;
drop function if exists public.voice_room_force_open_mic();
drop function if exists public.voice_room_participants_open_mic_lock();
drop function if exists public.voice_room_participants_open_mic_lock_v2();
drop function if exists public.voice_room_mute_lock();

-- 1) Column for lock state
alter table public.voice_room_participants
  add column if not exists mute_locked boolean not null default false;

-- 2) RLS: keep it simple + reliable for now (public rooms)
alter table public.voice_room_participants enable row level security;
alter table public.voice_room_hand_raises enable row level security;

do $$
declare r record;
begin
  for r in (select policyname from pg_policies where schemaname='public' and tablename='voice_room_participants') loop
    execute format('drop policy if exists %I on public.voice_room_participants;', r.policyname);
  end loop;
  for r in (select policyname from pg_policies where schemaname='public' and tablename='voice_room_hand_raises') loop
    execute format('drop policy if exists %I on public.voice_room_hand_raises;', r.policyname);
  end loop;
end $$;

-- Participants: any authenticated can read rows for existing rooms
create policy vrp_select
on public.voice_room_participants
for select
to authenticated
using (exists (select 1 from public.voice_rooms r where r.id = voice_room_participants.room_id));

-- Participants: user can insert self
create policy vrp_insert_self
on public.voice_room_participants
for insert
to authenticated
with check (user_id = auth.uid());

-- Participants: user can update self; host can update anyone in their room
create policy vrp_update_self_or_host
on public.voice_room_participants
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.voice_rooms r where r.id = voice_room_participants.room_id and r.creator_id = auth.uid())
)
with check (
  user_id = auth.uid()
  or exists (select 1 from public.voice_rooms r where r.id = voice_room_participants.room_id and r.creator_id = auth.uid())
);

-- Participants: user can delete self; host can delete anyone in their room
create policy vrp_delete_self_or_host
on public.voice_room_participants
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.voice_rooms r where r.id = voice_room_participants.room_id and r.creator_id = auth.uid())
);

-- Hand raises: any authenticated can read rows for existing rooms
create policy vrh_select
on public.voice_room_hand_raises
for select
to authenticated
using (exists (select 1 from public.voice_rooms r where r.id = voice_room_hand_raises.room_id));

-- Hand raises: user can insert/update/delete self; host can delete
create policy vrh_insert_self
on public.voice_room_hand_raises
for insert
to authenticated
with check (user_id = auth.uid());

create policy vrh_update_self
on public.voice_room_hand_raises
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy vrh_delete_self_or_host
on public.voice_room_hand_raises
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.voice_rooms r where r.id = voice_room_hand_raises.room_id and r.creator_id = auth.uid())
);

-- 3) Trigger: enforce mute lock semantics without breaking host self-mic
create or replace function public.voice_room_mute_lock_enforce()
returns trigger
language plpgsql
as $$
declare
  updater uuid;
  is_room_host boolean;
begin
  updater := auth.uid();
  is_room_host := exists (
    select 1
    from public.voice_rooms r
    where r.id = new.room_id
      and r.creator_id = updater
  );

  -- Self update: if locked, you stay muted and cannot change mute_locked.
  if updater = old.user_id then
    new.mute_locked := old.mute_locked;
    if old.mute_locked then
      new.is_muted := true;
    end if;
    return new;
  end if;

  -- Host update of others: muting locks, unmuting unlocks
  if is_room_host and new.user_id <> updater then
    if new.is_muted = true and old.is_muted = false then
      new.mute_locked := true;
    elsif new.is_muted = false and old.is_muted = true then
      new.mute_locked := false;
    end if;
    return new;
  end if;

  -- Preserve lock state by default
  new.mute_locked := old.mute_locked;
  return new;
end;
$$;

create trigger trg_voice_room_mute_lock
before update on public.voice_room_participants
for each row
execute function public.voice_room_mute_lock_enforce();

