-- Talk Now: availability + paid talk sessions (gems/minute)
-- This powers the "Talk to Someone" feature and makes the Connect tab meaningful.

-- Ensure uuid generation + updated_at trigger helper exist
create extension if not exists pgcrypto;

create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Availability table (opt-in)
create table if not exists public.talk_availability (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  mode text not null default 'both' check (mode in ('talk','listen','both')),
  status text not null default 'offline' check (status in ('available','busy','offline')),
  topics text[] not null default '{}'::text[],
  languages text[] not null default '{}'::text[],
  rate_gems_per_minute integer not null default 1 check (rate_gems_per_minute >= 0),
  min_billable_minutes integer not null default 1 check (min_billable_minutes >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp on public.talk_availability;
create trigger set_timestamp
before update on public.talk_availability
for each row execute function public.trigger_set_timestamp();

alter table public.talk_availability enable row level security;

-- Public can see available users (needed for discovery).
drop policy if exists "talk_availability_select_available" on public.talk_availability;
create policy "talk_availability_select_available"
on public.talk_availability
for select
to authenticated
using (status = 'available');

-- Users can read/update their own availability row.
drop policy if exists "talk_availability_select_own" on public.talk_availability;
create policy "talk_availability_select_own"
on public.talk_availability
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "talk_availability_upsert_own" on public.talk_availability;
create policy "talk_availability_upsert_own"
on public.talk_availability
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "talk_availability_update_own" on public.talk_availability;
create policy "talk_availability_update_own"
on public.talk_availability
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "talk_availability_delete_own" on public.talk_availability;
create policy "talk_availability_delete_own"
on public.talk_availability
for delete
to authenticated
using (auth.uid() = user_id);

-- 2) Sessions table
create table if not exists public.talk_sessions (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('requested','active','ended','cancelled','rejected')),
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  rate_gems_per_minute integer not null default 1 check (rate_gems_per_minute >= 0),
  billed_minutes integer not null default 0 check (billed_minutes >= 0),
  billed_gems integer not null default 0 check (billed_gems >= 0),
  settled_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists talk_sessions_requester_idx on public.talk_sessions(requester_id, created_at desc);
create index if not exists talk_sessions_provider_idx on public.talk_sessions(provider_id, created_at desc);
create index if not exists talk_sessions_status_idx on public.talk_sessions(status);

alter table public.talk_sessions enable row level security;

-- Participants can view their sessions
drop policy if exists "talk_sessions_select_participants" on public.talk_sessions;
create policy "talk_sessions_select_participants"
on public.talk_sessions
for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = provider_id);

-- Requester can create a session
drop policy if exists "talk_sessions_insert_requester" on public.talk_sessions;
create policy "talk_sessions_insert_requester"
on public.talk_sessions
for insert
to authenticated
with check (auth.uid() = requester_id);

-- Participants can update basic session fields (ended_at/status) for their sessions.
drop policy if exists "talk_sessions_update_participants" on public.talk_sessions;
create policy "talk_sessions_update_participants"
on public.talk_sessions
for update
to authenticated
using (auth.uid() = requester_id or auth.uid() = provider_id)
with check (auth.uid() = requester_id or auth.uid() = provider_id);

-- 3) Settlement RPC: bill requester by minute and pay provider in gems.
-- Uses SECURITY DEFINER to allow debiting requester even if provider triggers the end.
create or replace function public.end_talk_session(session_id uuid)
returns table (billed_minutes integer, billed_gems integer, requester_new_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid;
  s record;
  minutes integer;
  owed integer;
  payer_balance integer;
  pay integer;
  requester_name text;
  provider_name text;
begin
  caller := auth.uid();
  if caller is null then
    raise exception 'not authenticated';
  end if;

  select *
  into s
  from public.talk_sessions
  where id = session_id
  for update;

  if not found then
    raise exception 'session not found';
  end if;

  if caller <> s.requester_id and caller <> s.provider_id then
    raise exception 'not allowed';
  end if;

  -- idempotent: if already settled, return the stored billing info
  if s.settled_at is not null then
    return query
      select s.billed_minutes::integer, s.billed_gems::integer,
        (select gem_balance from public.user_wallets where user_id = s.requester_id)::integer;
    return;
  end if;

  -- Mark ended if not ended yet
  if s.ended_at is null then
    update public.talk_sessions
    set ended_at = now(), status = 'ended'
    where id = session_id;
    s.ended_at := now();
  end if;

  -- Ensure wallets exist (align with send_gift() behavior)
  insert into public.user_wallets (user_id, gem_balance, total_earned, total_sent)
  values (s.requester_id, 500, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.user_wallets (user_id, gem_balance, total_earned, total_sent)
  values (s.provider_id, 500, 0, 0)
  on conflict (user_id) do nothing;

  minutes := greatest(1, ceil(extract(epoch from (s.ended_at - s.started_at)) / 60.0)::integer);
  owed := greatest(0, minutes * s.rate_gems_per_minute);

  select gem_balance into payer_balance
  from public.user_wallets
  where user_id = s.requester_id
  for update;

  pay := least(payer_balance, owed);

  -- Deduct from requester
  update public.user_wallets
  set
    gem_balance = gem_balance - pay,
    total_sent = total_sent + pay,
    updated_at = now()
  where user_id = s.requester_id;

  -- Credit provider
  update public.user_wallets
  set
    gem_balance = gem_balance + pay,
    total_earned = total_earned + pay,
    updated_at = now()
  where user_id = s.provider_id;

  select name into requester_name from public.profiles where id = s.requester_id;
  select name into provider_name from public.profiles where id = s.provider_id;

  insert into public.gift_transactions (
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    gift_id,
    gift_name,
    gift_value,
    room_id,
    room_title
  )
  values (
    s.requester_id,
    requester_name,
    s.provider_id,
    provider_name,
    ('talk_session:' || session_id::text),
    'Talk time',
    pay,
    null,
    'Talk session'
  );

  update public.talk_sessions
  set
    billed_minutes = minutes,
    billed_gems = pay,
    settled_at = now()
  where id = session_id;

  return query
    select minutes::integer, pay::integer, (payer_balance - pay)::integer;
end;
$$;

revoke all on function public.end_talk_session(uuid) from public;
grant execute on function public.end_talk_session(uuid) to authenticated;

