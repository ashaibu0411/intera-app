-- Add expiration to voice rooms so they auto-disappear after a set time.
-- (You can later add a scheduled job to mark expired rooms ended / clean up rows.)

alter table public.voice_rooms
add column if not exists expires_at timestamptz null;

-- Default: 2 hours after creation (applies to new rows)
alter table public.voice_rooms
alter column expires_at set default (now() + interval '2 hours');

create index if not exists voice_rooms_expires_at_idx on public.voice_rooms (expires_at);

