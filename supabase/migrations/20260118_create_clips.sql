-- Clips (TikTok-style short videos)

-- Storage bucket (public) for clip videos + thumbnails
insert into storage.buckets (id, name, public)
values ('clips', 'clips', true)
on conflict (id) do update set public = excluded.public;

-- Public read for clips bucket
do $$
begin
  -- If policy already exists, ignore
  begin
    create policy "clips_bucket_public_read"
    on storage.objects
    for select
    using (bucket_id = 'clips');
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "clips_bucket_auth_write"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'clips' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "clips_bucket_auth_update_own"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'clips' and auth.uid() = owner)
    with check (bucket_id = 'clips' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;

  begin
    create policy "clips_bucket_auth_delete_own"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'clips' and auth.uid() = owner);
  exception when duplicate_object then
    null;
  end;
end $$;

-- Main clips table
create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_url text not null,
  thumbnail_url text null,
  description text not null,
  music_tag text null,
  likes_count int not null default 0,
  comments_count int not null default 0,
  shares_count int not null default 0,
  views_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clips_created_at_idx on public.clips (created_at desc);
create index if not exists clips_user_id_idx on public.clips (user_id);

-- Likes table
create table if not exists public.clip_likes (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (clip_id, user_id)
);

-- RLS
alter table public.clips enable row level security;
alter table public.clip_likes enable row level security;

-- clips policies
drop policy if exists "clips_read_public" on public.clips;
create policy "clips_read_public"
on public.clips
for select
using (true);

drop policy if exists "clips_insert_own" on public.clips;
create policy "clips_insert_own"
on public.clips
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "clips_delete_own" on public.clips;
create policy "clips_delete_own"
on public.clips
for delete
to authenticated
using (auth.uid() = user_id);

-- clip_likes policies
drop policy if exists "clip_likes_read_public" on public.clip_likes;
create policy "clip_likes_read_public"
on public.clip_likes
for select
using (true);

drop policy if exists "clip_likes_insert_self" on public.clip_likes;
create policy "clip_likes_insert_self"
on public.clip_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "clip_likes_delete_self" on public.clip_likes;
create policy "clip_likes_delete_self"
on public.clip_likes
for delete
to authenticated
using (auth.uid() = user_id);

-- RPC helpers (safe server-side counters)
create or replace function public.increment_clip_likes(clip_id uuid)
returns void
language sql
security definer
as $$
  update public.clips set likes_count = likes_count + 1 where id = clip_id;
$$;

create or replace function public.decrement_clip_likes(clip_id uuid)
returns void
language sql
security definer
as $$
  update public.clips set likes_count = greatest(likes_count - 1, 0) where id = clip_id;
$$;

create or replace function public.increment_clip_views(clip_id uuid)
returns void
language sql
security definer
as $$
  update public.clips set views_count = views_count + 1 where id = clip_id;
$$;

-- Allow authenticated to execute RPC
grant execute on function public.increment_clip_likes(uuid) to authenticated;
grant execute on function public.decrement_clip_likes(uuid) to authenticated;
grant execute on function public.increment_clip_views(uuid) to authenticated;

