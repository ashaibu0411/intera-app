-- Fix: "column reference rate_gems_per_minute is ambiguous"
-- This happens when a PL/pgSQL variable/argument name conflicts with a column name
-- (default plpgsql.variable_conflict = error).
-- We keep the original argument name (so clients keep working),
-- and fully-qualify the column reference to avoid ambiguity.

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
  select ta.status, ta.rate_gems_per_minute
  into provider_status, provider_rate
  from public.talk_availability ta
  where ta.user_id = provider_id
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

