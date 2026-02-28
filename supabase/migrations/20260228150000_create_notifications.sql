-- In-app notifications feed (server-backed)

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid null references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

create index if not exists notifications_recipient_read_idx
  on public.notifications(recipient_id, read_at);

alter table public.notifications enable row level security;

-- Recipients can read their notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (auth.uid() = recipient_id);

-- Recipients can mark read/unread (update)
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

-- Recipients can delete their notifications
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications
for delete
to authenticated
using (auth.uid() = recipient_id);

