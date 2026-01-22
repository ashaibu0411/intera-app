-- Impact Stories: schools + nonprofits can share stories and fundraising needs
-- Supports donations, grants, and sponsorships (via external links/contact).

create extension if not exists pgcrypto;

create table if not exists public.impact_stories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,

  -- Organization info
  org_type text not null check (org_type in ('school', 'nonprofit')),
  org_name text not null,
  website text null,

  -- Location (global)
  country text not null,
  admin_area text null,
  city text null,
  neighborhood text null,
  location_label text null,

  -- Story content
  mission text not null,
  story text not null,
  needs text[] not null default '{}'::text[], -- e.g. {"donations","grants","sponsorships"}

  -- Fundraising / sponsorship calls-to-action
  funding_goal_amount numeric null,
  funding_goal_currency text null,
  donation_url text null,
  grant_url text null,
  sponsorship_email text null,
  sponsorship_phone text null,

  -- Media
  cover_image_url text null,
  gallery_urls text[] not null default '{}'::text[],

  -- Moderation / visibility
  status text not null default 'published'
    check (status in ('draft', 'pending_review', 'published', 'paused')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists impact_stories_owner_id_idx on public.impact_stories (owner_id);
create index if not exists impact_stories_status_idx on public.impact_stories (status);
create index if not exists impact_stories_org_type_idx on public.impact_stories (org_type);
create index if not exists impact_stories_country_idx on public.impact_stories (country);
create index if not exists impact_stories_city_idx on public.impact_stories (city);
create index if not exists impact_stories_created_at_idx on public.impact_stories (created_at desc);

alter table public.impact_stories enable row level security;

-- Published stories are readable by everyone; owners can read their own drafts/pending/paused.
drop policy if exists "impact_stories_select_published_or_owner" on public.impact_stories;
create policy "impact_stories_select_published_or_owner"
  on public.impact_stories
  for select
  using (status = 'published' or owner_id = auth.uid());

-- Only authenticated users can create stories as themselves.
drop policy if exists "impact_stories_insert_own" on public.impact_stories;
create policy "impact_stories_insert_own"
  on public.impact_stories
  for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Only owners can update/delete their stories.
drop policy if exists "impact_stories_update_own" on public.impact_stories;
create policy "impact_stories_update_own"
  on public.impact_stories
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "impact_stories_delete_own" on public.impact_stories;
create policy "impact_stories_delete_own"
  on public.impact_stories
  for delete
  to authenticated
  using (owner_id = auth.uid());

create or replace function public.touch_impact_stories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_impact_stories_updated_at on public.impact_stories;
create trigger trg_touch_impact_stories_updated_at
before update on public.impact_stories
for each row
execute procedure public.touch_impact_stories_updated_at();

