-- Impact Stories: add media fields + admin review flow

create extension if not exists pgcrypto;

-- ============
-- Admins table
-- ============
create table if not exists public.app_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

-- Admins can read only their own row (used by is_admin()).
drop policy if exists "app_admins_select_own" on public.app_admins;
create policy "app_admins_select_own"
  on public.app_admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- Helper function: is current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- =========================
-- Impact stories: new fields
-- =========================
alter table public.impact_stories
  add column if not exists video_url text null,
  add column if not exists review_note text null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists reviewed_by uuid null references public.profiles(id) on delete set null;

-- =========================
-- Update RLS policies to support admins
-- =========================
drop policy if exists "impact_stories_select_published_or_owner" on public.impact_stories;
create policy "impact_stories_select_published_or_owner_or_admin"
  on public.impact_stories
  for select
  using (status = 'published' or owner_id = auth.uid() or public.is_admin());

drop policy if exists "impact_stories_insert_own" on public.impact_stories;
create policy "impact_stories_insert_own"
  on public.impact_stories
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "impact_stories_update_own" on public.impact_stories;
create policy "impact_stories_update_own_or_admin"
  on public.impact_stories
  for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "impact_stories_delete_own" on public.impact_stories;
create policy "impact_stories_delete_own_or_admin"
  on public.impact_stories
  for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

