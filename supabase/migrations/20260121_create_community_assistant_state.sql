-- Store Community Assistant chat history per user (cloud sync across devices)

create table if not exists public.community_assistant_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.community_assistant_state enable row level security;

create policy "community_assistant_state_select_own"
on public.community_assistant_state
for select
to authenticated
using (auth.uid() = user_id);

create policy "community_assistant_state_insert_own"
on public.community_assistant_state
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "community_assistant_state_update_own"
on public.community_assistant_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

