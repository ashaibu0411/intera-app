-- Community digests: user subscriptions + history

create table if not exists public.digest_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  neighborhood text null,
  frequency text not null default 'weekly', -- 'daily' | 'weekly'
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, city, neighborhood, frequency)
);

create index if not exists digest_subscriptions_user_id_idx on public.digest_subscriptions (user_id);
create index if not exists digest_subscriptions_city_idx on public.digest_subscriptions (city);

alter table public.digest_subscriptions enable row level security;

drop policy if exists "digest_subscriptions_select_own" on public.digest_subscriptions;
create policy "digest_subscriptions_select_own"
on public.digest_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "digest_subscriptions_insert_own" on public.digest_subscriptions;
create policy "digest_subscriptions_insert_own"
on public.digest_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "digest_subscriptions_update_own" on public.digest_subscriptions;
create policy "digest_subscriptions_update_own"
on public.digest_subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "digest_subscriptions_delete_own" on public.digest_subscriptions;
create policy "digest_subscriptions_delete_own"
on public.digest_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.touch_digest_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_digest_subscriptions_updated_at on public.digest_subscriptions;
create trigger trg_touch_digest_subscriptions_updated_at
before update on public.digest_subscriptions
for each row
execute procedure public.touch_digest_subscriptions_updated_at();

create table if not exists public.community_digest_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  neighborhood text null,
  frequency text not null, -- 'daily' | 'weekly'
  period_start timestamptz not null,
  period_end timestamptz not null,
  digest_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_digest_history_user_id_idx on public.community_digest_history (user_id);
create index if not exists community_digest_history_city_idx on public.community_digest_history (city);

alter table public.community_digest_history enable row level security;

drop policy if exists "community_digest_history_select_own" on public.community_digest_history;
create policy "community_digest_history_select_own"
on public.community_digest_history
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "community_digest_history_insert_own" on public.community_digest_history;
create policy "community_digest_history_insert_own"
on public.community_digest_history
for insert
to authenticated
with check (auth.uid() = user_id);

