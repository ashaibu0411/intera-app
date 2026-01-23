-- Talk Now: safety layer
-- - user blocks
-- - user reports
-- - start_talk_session RPC with 18+ check + block check + availability check + rate limit
-- - end_talk_session: mark provider available again

create extension if not exists pgcrypto;

-- 1) Blocks (mutual filtering)
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own"
on public.user_blocks
for select
to authenticated
using (auth.uid() = blocker_id);

drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own"
on public.user_blocks
for insert
to authenticated
with check (auth.uid() = blocker_id);

drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own"
on public.user_blocks
for delete
to authenticated
using (auth.uid() = blocker_id);

-- 2) Reports
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'other',
  details text null,
  created_at timestamptz not null default now()
);

create index if not exists user_reports_reporter_idx on public.user_reports(reporter_id, created_at desc);
create index if not exists user_reports_reported_idx on public.user_reports(reported_id, created_at desc);

alter table public.user_reports enable row level security;

drop policy if exists "user_reports_insert_own" on public.user_reports;
create policy "user_reports_insert_own"
on public.user_reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "user_reports_select_own" on public.user_reports;
create policy "user_reports_select_own"
on public.user_reports
for select
to authenticated
using (auth.uid() = reporter_id);

-- 3) Start session RPC (enforces safety + rate limit)
create or replace function public.start_talk_session(
  provider_id uuid,
  rate_gems_per_minute integer default null
)
returns public.talk_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid;
  provider_rate integer;
  created public.talk_sessions;
  recent_count integer;
  provider_status text;
  has_age boolean;
  blocked boolean;
begin
  caller := auth.uid();
  if caller is null then
    raise exception 'not authenticated';
  end if;
  if provider_id is null then
    raise exception 'provider_id is required';
  end if;
  if provider_id = caller then
    raise exception 'cannot start a session with yourself';
  end if;

  -- 18+ required
  select exists(select 1 from public.talk_age_confirmations where user_id = caller)
  into has_age;
  if not has_age then
    raise exception 'age_not_confirmed';
  end if;

  -- Block check (either direction)
  select exists(
    select 1
    from public.user_blocks b
    where (b.blocker_id = caller and b.blocked_id = provider_id)
       or (b.blocker_id = provider_id and b.blocked_id = caller)
  ) into blocked;
  if blocked then
    raise exception 'blocked';
  end if;

  -- Rate limit: max 3 session starts per 10 minutes per requester
  select count(*)
  into recent_count
  from public.talk_sessions s
  where s.requester_id = caller
    and s.created_at > (now() - interval '10 minutes');
  if recent_count >= 3 then
    raise exception 'rate_limited';
  end if;

  -- Provider must be available
  select status, rate_gems_per_minute
  into provider_status, provider_rate
  from public.talk_availability
  where user_id = provider_id
  for update;

  if provider_status is null then
    raise exception 'provider_not_available';
  end if;
  if provider_status <> 'available' then
    raise exception 'provider_not_available';
  end if;

  -- Use provided rate if valid, else provider's current rate
  if rate_gems_per_minute is null or rate_gems_per_minute < 0 then
    rate_gems_per_minute := provider_rate;
  end if;

  insert into public.talk_sessions (
    requester_id,
    provider_id,
    status,
    started_at,
    rate_gems_per_minute
  )
  values (
    caller,
    provider_id,
    'active',
    now(),
    rate_gems_per_minute
  )
  returning * into created;

  -- Mark provider busy
  update public.talk_availability
  set status = 'busy', updated_at = now()
  where user_id = provider_id;

  return created;
end;
$$;

revoke all on function public.start_talk_session(uuid, integer) from public;
grant execute on function public.start_talk_session(uuid, integer) to authenticated;

-- 4) Enhance end_talk_session: if provider was busy, set to available
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

  -- Release provider (best-effort)
  update public.talk_availability
  set status = 'available', updated_at = now()
  where user_id = s.provider_id and status = 'busy';

  return query
    select minutes::integer, pay::integer, (payer_balance - pay)::integer;
end;
$$;

revoke all on function public.end_talk_session(uuid) from public;
grant execute on function public.end_talk_session(uuid) to authenticated;

