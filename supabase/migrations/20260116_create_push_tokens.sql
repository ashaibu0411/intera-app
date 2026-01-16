-- Store device push tokens for remote (true) push notifications
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  token text not null unique,
  platform text not null default 'unknown',
  device_id text null,

  enabled boolean not null default true,

  -- Location scoping (best-effort; updated when user changes location)
  country text null,
  admin_area text null,
  city text null,
  neighborhood text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens(user_id);
create index if not exists push_tokens_city_idx on public.push_tokens(city);
create index if not exists push_tokens_neighborhood_idx on public.push_tokens(neighborhood);
create index if not exists push_tokens_enabled_idx on public.push_tokens(enabled);

-- Keep updated_at fresh
create or replace function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_timestamp_push_tokens on public.push_tokens;
create trigger set_timestamp_push_tokens
before update on public.push_tokens
for each row
execute function public.trigger_set_updated_at();

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_select_own" on public.push_tokens;
create policy "push_tokens_select_own"
  on public.push_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "push_tokens_upsert_own" on public.push_tokens;
create policy "push_tokens_upsert_own"
  on public.push_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

