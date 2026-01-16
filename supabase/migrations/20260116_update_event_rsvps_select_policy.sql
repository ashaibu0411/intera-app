-- Update RSVP select policy so counts can be computed for public events.
-- Run in Supabase SQL editor if you want "X going" visible to everyone.

alter table public.event_rsvps enable row level security;

drop policy if exists "event_rsvps_select_own" on public.event_rsvps;
drop policy if exists "event_rsvps_select_public_or_own" on public.event_rsvps;

create policy "event_rsvps_select_public_or_own"
  on public.event_rsvps
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.events e
      where e.id = event_id and e.is_public = true
    )
  );

