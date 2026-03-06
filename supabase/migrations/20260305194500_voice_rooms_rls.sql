-- Voice rooms: RLS policies for participants + hand raises
-- This fixes: host not seeing audience count, raised hands not visible to host.

-- Participants ---------------------------------------------------------------
alter table if exists public.voice_room_participants enable row level security;

drop policy if exists "vrp_select_room_participants" on public.voice_room_participants;
create policy "vrp_select_room_participants"
on public.voice_room_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_participants.room_id
      and r.status <> 'ended'
  )
);

drop policy if exists "vrp_insert_self" on public.voice_room_participants;
create policy "vrp_insert_self"
on public.voice_room_participants
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "vrp_update_self_or_host" on public.voice_room_participants;
create policy "vrp_update_self_or_host"
on public.voice_room_participants
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_participants.room_id
      and r.creator_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_participants.room_id
      and r.creator_id = auth.uid()
  )
);

drop policy if exists "vrp_delete_self_or_host" on public.voice_room_participants;
create policy "vrp_delete_self_or_host"
on public.voice_room_participants
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_participants.room_id
      and r.creator_id = auth.uid()
  )
);

-- Hand raises ---------------------------------------------------------------
alter table if exists public.voice_room_hand_raises enable row level security;

drop policy if exists "vrh_select_room" on public.voice_room_hand_raises;
create policy "vrh_select_room"
on public.voice_room_hand_raises
for select
to authenticated
using (
  exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_hand_raises.room_id
      and r.status <> 'ended'
  )
);

drop policy if exists "vrh_insert_self" on public.voice_room_hand_raises;
create policy "vrh_insert_self"
on public.voice_room_hand_raises
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "vrh_update_self_or_host" on public.voice_room_hand_raises;
create policy "vrh_update_self_or_host"
on public.voice_room_hand_raises
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_hand_raises.room_id
      and r.creator_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_hand_raises.room_id
      and r.creator_id = auth.uid()
  )
);

drop policy if exists "vrh_delete_self_or_host" on public.voice_room_hand_raises;
create policy "vrh_delete_self_or_host"
on public.voice_room_hand_raises
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.voice_rooms r
    where r.id = voice_room_hand_raises.room_id
      and r.creator_id = auth.uid()
  )
);

