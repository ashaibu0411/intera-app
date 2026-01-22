-- Voice rooms: add "hand raise intent" + allow host/mod cleanup

-- 1) Add intent to hand raises (question/insight/announcement/testimony)
alter table public.voice_room_hand_raises
add column if not exists intent text null
check (intent in ('question', 'insight', 'announcement', 'testimony'));

create index if not exists voice_room_hand_raises_intent_idx on public.voice_room_hand_raises (intent);

-- 2) Allow host/mod to delete participant rows (for cleanup when ending/reopening)
drop policy if exists "voice_room_participants_delete_host_mod" on public.voice_room_participants;
create policy "voice_room_participants_delete_host_mod"
on public.voice_room_participants
for delete
to authenticated
using (
  exists (
    select 1
    from public.voice_room_participants me
    where me.room_id = voice_room_participants.room_id
      and me.user_id = auth.uid()
      and me.role in ('host', 'moderator')
  )
);

