-- Add online presence + visibility fields to profiles
alter table public.profiles
  add column if not exists is_online boolean not null default false,
  add column if not exists last_seen timestamptz not null default now(),
  add column if not exists show_online_status boolean not null default true;

create index if not exists profiles_is_online_idx on public.profiles (is_online);
create index if not exists profiles_last_seen_idx on public.profiles (last_seen desc);

