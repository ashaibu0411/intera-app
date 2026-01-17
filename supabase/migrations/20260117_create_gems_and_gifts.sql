-- Gems + gifting (wallets + gift transactions)

create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  gem_balance integer not null default 0,
  total_earned integer not null default 0,
  total_sent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp on public.user_wallets;
create trigger set_timestamp
before update on public.user_wallets
for each row execute function public.trigger_set_timestamp();

create table if not exists public.gift_transactions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text null,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text null,
  gift_id text not null,
  gift_name text not null,
  gift_value integer not null check (gift_value >= 0),
  room_id uuid null references public.voice_rooms(id) on delete set null,
  room_title text null,
  created_at timestamptz not null default now()
);

create index if not exists gift_transactions_room_id_idx on public.gift_transactions(room_id);
create index if not exists gift_transactions_sender_id_idx on public.gift_transactions(sender_id);
create index if not exists gift_transactions_recipient_id_idx on public.gift_transactions(recipient_id);

alter table public.user_wallets enable row level security;
alter table public.gift_transactions enable row level security;

-- Wallet policies: users can read/upsert their own wallet.
drop policy if exists "user_wallets_select_own" on public.user_wallets;
create policy "user_wallets_select_own"
on public.user_wallets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_wallets_insert_own" on public.user_wallets;
create policy "user_wallets_insert_own"
on public.user_wallets
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_wallets_update_own" on public.user_wallets;
create policy "user_wallets_update_own"
on public.user_wallets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Gift transactions: allow read for participants (sender/recipient) + allow insert by sender.
drop policy if exists "gift_transactions_select_sender_or_recipient" on public.gift_transactions;
create policy "gift_transactions_select_sender_or_recipient"
on public.gift_transactions
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "gift_transactions_select_room_participants" on public.gift_transactions;
create policy "gift_transactions_select_room_participants"
on public.gift_transactions
for select
to authenticated
using (
  room_id is not null
  and exists (
    select 1
    from public.voice_room_participants p
    where p.room_id = gift_transactions.room_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "gift_transactions_insert_sender" on public.gift_transactions;
create policy "gift_transactions_insert_sender"
on public.gift_transactions
for insert
to authenticated
with check (auth.uid() = sender_id);

