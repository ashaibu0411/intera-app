-- Store Translator preferences + recent translations per user (cloud sync across devices)

create table if not exists public.translator_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  source_lang_code text not null default 'en',
  target_lang_code text not null default 'sw',
  use_ai boolean not null default true,
  recents jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.translator_state enable row level security;

-- Only the owner can read their state
create policy "translator_state_select_own"
on public.translator_state
for select
to authenticated
using (auth.uid() = user_id);

-- Only the owner can insert their row
create policy "translator_state_insert_own"
on public.translator_state
for insert
to authenticated
with check (auth.uid() = user_id);

-- Only the owner can update their row
create policy "translator_state_update_own"
on public.translator_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

