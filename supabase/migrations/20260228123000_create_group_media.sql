-- Albums media table (photos + videos) for groups
-- This complements existing group_photos (photos-only) and enables videos in albums.

create table if not exists public.group_media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.group_albums(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  type text not null check (type in ('photo','video')),
  thumbnail_url text null,
  caption text null,
  created_at timestamptz not null default now()
);

create index if not exists group_media_album_idx on public.group_media(album_id);
create index if not exists group_media_created_at_idx on public.group_media(created_at desc);

alter table public.group_media enable row level security;

-- Media: allow reads if the parent group is public OR viewer is a group member
drop policy if exists "group_media_select" on public.group_media;
create policy "group_media_select"
on public.group_media
for select
using (
  exists (
    select 1
    from public.group_albums a
    join public.groups g on g.id = a.group_id
    where a.id = album_id
      and (
        g.visibility = 'public'
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = g.id and gm.user_id = auth.uid()
        )
      )
  )
);

-- Media: members can upload to albums in their group
drop policy if exists "group_media_insert" on public.group_media;
create policy "group_media_insert"
on public.group_media
for insert
to authenticated
with check (
  auth.uid() = uploader_id
  and exists (
    select 1
    from public.group_albums a
    join public.group_members gm on gm.group_id = a.group_id
    where a.id = album_id
      and gm.user_id = auth.uid()
  )
);

-- Media: uploader or admins/moderators can delete
drop policy if exists "group_media_delete" on public.group_media;
create policy "group_media_delete"
on public.group_media
for delete
to authenticated
using (
  auth.uid() = uploader_id
  or exists (
    select 1
    from public.group_albums a
    join public.group_members gm on gm.group_id = a.group_id
    where a.id = album_id
      and gm.user_id = auth.uid()
      and gm.role in ('admin','moderator')
  )
);

