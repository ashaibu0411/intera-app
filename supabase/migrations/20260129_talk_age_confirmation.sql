-- Talk Now: 18+ confirmation record
-- Client can require this before allowing paid talk sessions.

create table if not exists public.talk_age_confirmations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.talk_age_confirmations enable row level security;

-- User can read their own confirmation record
drop policy if exists "talk_age_confirmations_select_own" on public.talk_age_confirmations;
create policy "talk_age_confirmations_select_own"
on public.talk_age_confirmations
for select
to authenticated
using (auth.uid() = user_id);

-- User can insert/upsert their own confirmation record
drop policy if exists "talk_age_confirmations_insert_own" on public.talk_age_confirmations;
create policy "talk_age_confirmations_insert_own"
on public.talk_age_confirmations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "talk_age_confirmations_update_own" on public.talk_age_confirmations;
create policy "talk_age_confirmations_update_own"
on public.talk_age_confirmations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
