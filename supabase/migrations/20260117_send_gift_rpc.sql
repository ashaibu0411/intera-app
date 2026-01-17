-- Secure gifting RPC (updates sender + recipient wallets and records transaction)

create or replace function public.send_gift(
  recipient_id uuid,
  gift_id text,
  gift_name text,
  gift_value integer,
  room_id uuid default null,
  room_title text default null,
  sender_name text default null,
  recipient_name text default null
)
returns table (new_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_id uuid;
  sender_balance integer;
begin
  sender_id := auth.uid();
  if sender_id is null then
    raise exception 'not authenticated';
  end if;

  if gift_value is null or gift_value <= 0 then
    raise exception 'invalid gift_value';
  end if;

  if recipient_id is null then
    raise exception 'recipient_id required';
  end if;

  -- Ensure wallets exist (500 starter gems on first create to match client assumptions)
  insert into public.user_wallets (user_id, gem_balance, total_earned, total_sent)
  values (sender_id, 500, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.user_wallets (user_id, gem_balance, total_earned, total_sent)
  values (recipient_id, 500, 0, 0)
  on conflict (user_id) do nothing;

  select gem_balance into sender_balance
  from public.user_wallets
  where user_id = sender_id
  for update;

  if sender_balance < gift_value then
    raise exception 'insufficient gems';
  end if;

  -- Deduct from sender
  update public.user_wallets
  set
    gem_balance = gem_balance - gift_value,
    total_sent = total_sent + gift_value,
    updated_at = now()
  where user_id = sender_id;

  -- Credit recipient
  update public.user_wallets
  set
    gem_balance = gem_balance + gift_value,
    total_earned = total_earned + gift_value,
    updated_at = now()
  where user_id = recipient_id;

  -- Record transaction
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
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    gift_id,
    gift_name,
    gift_value,
    room_id,
    room_title
  );

  return query
    select (sender_balance - gift_value)::integer as new_balance;
end;
$$;

revoke all on function public.send_gift(uuid, text, text, integer, uuid, text, text, text) from public;
grant execute on function public.send_gift(uuid, text, text, integer, uuid, text, text, text) to authenticated;

