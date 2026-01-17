-- Add video support for feed posts
-- Note: you also need a Supabase Storage bucket named `post-videos` (public)
-- so the app can upload video files and render them in the feed.

alter table public.posts
add column if not exists video text;

